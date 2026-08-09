/**
 * react-native-google-cast v5 — playground + device-pass harness.
 *
 * Exercises the v5 façades over the central state machine and makes the
 * device-gated assertions observable. Phase 3 spike rows:
 *  - 0.1 event stream: live cast-state, device list, and a session-lifecycle log.
 *  - 0.2 error propagation (#12): "Probe error" runs a failing mutation and shows
 *    the caught CastError's `code` + `nativeCode` (the load-bearing unknown).
 *  - 0.3 teardown: reload the app (Fast Refresh) and confirm no leaked listeners.
 *    There is deliberately no `dispose()` button — `dispose()` is documented as
 *    the Fast Refresh / runtime-teardown path, not public API.
 *
 * Phase 6 device pass adds the "Probes" section (collapsed by default): media,
 * queue, hooks, custom channel, and the request-flush race. Those probes are
 * DISPOSABLE — crude on purpose, one button per real API call, so a failed
 * checklist row has exactly one suspect.
 *
 * T6 (2026-08-09) collapsed the duplication that was worth collapsing — see
 * `probeHelpers.ts` for what did *not* move and why. **T7 — splitting a clean
 * example screen out of this rig — is postponed** along with bead `v5-a7n`, so
 * this file is still the harness and not an example to copy.
 *
 * ⚠️ `.maestro/tier1-fake-session.yml` asserts on the text of the status lines,
 * the two "Fake start"/"Fake end" buttons, and the `fake session
 * started/ended delivered=true` log lines. The probes section is collapsed by
 * default with the intent of leaving tier-1's visible surface unchanged — but
 * the collapsed state still adds the toggle row, which shortens the (flex: 1)
 * log box.
 *
 * Confirmed safe on device 2026-08-03 (moto g05): all seven of the flow's
 * assertions render without scrolling after Fake start / Fake end.
 *
 * The earlier note here — "Maestro on this machine reports 0 devices connected
 * for a physically-attached phone" — was wrong about the cause and is fixed
 * (2026-08-09): an unrelated local service listening on TCP 5555 made `adb`
 * register a phantom `emulator-5554 offline`, and Maestro refuses to pick a
 * device while a dead entry is listed. Start the adb server with the emulator
 * port scan clipped below it and the phone is driven normally:
 *
 *   adb kill-server && ADB_LOCAL_TRANSPORT_MAX_PORT=5554 adb start-server
 *   JAVA_HOME=... maestro test --platform android .maestro/tier1-fake-session.yml
 */

import {
  Component,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
// NOT react-native's SafeAreaView: that one is iOS-only (a no-op on Android)
// and deprecated. On Android it left the header — including the CastButton —
// under the status bar, where roughly half of all taps were swallowed by the
// system bar instead of reaching the button. Found during the Phase 6 device
// pass; the CastButton was wrongly suspected of being broken.
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import GoogleCast, {
  CastButton,
  useCastDevice,
  useCastSession,
  useCastState,
  useCastSupported,
  useChannelStatus,
  useCastChannel,
  useDevices,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
  type CastError,
  type CastState,
  type Device,
} from 'react-native-google-cast';
// Debug-only native fake seam (T3) — deliberately not on the package barrel.
import {
  injectFakeMediaStatus,
  injectFakeSessionEnded,
  injectFakeSessionStarted,
} from 'react-native-google-cast/src/debug/fakeSession';
// Store internals the public surface deliberately cannot express (v5-868).
import {
  dumpStoreDiagnostics,
  formatStoreDiagnostics,
} from 'react-native-google-cast/src/debug/storeDiagnostics';
import {
  BLACKHOLE_URL,
  CHANNEL_PROBE_ENABLED,
  LAN_FIXTURE,
  LAN_QUEUE_FIXTURES,
  MEDIA_FIXTURES,
  PROBE_NAMESPACE,
  QUEUE_FIXTURES,
  type MediaFixture,
} from './probeFixtures';
import { makeProbe, type Append } from './probeHelpers';

const IS_WEB = Platform.OS === 'web';

/**
 * The web platform gaps, rendered where they can be checked against the app
 * rather than only read in a table.
 *
 * **Deliberately a caveat banner and not a set of hidden rows.** Bead v5-5tx
 * originally proposed branching on `Platform.OS` to *hide* the native-only
 * probes on web. That is worse: `docs/getting-started/web.md` claims things
 * like "`showExpandedControls()` resolves `false` on web" — which is a
 * falsifiable claim about our transport, and hiding the button deletes the only
 * thing that could falsify it. Every row stays pressable on web; this banner
 * says what the expected answer is, so a wrong answer is visible instead of
 * invisible.
 *
 * Keep in step with the support table in `docs/getting-started/web.md`.
 */
function WebCaveats() {
  return (
    <View style={styles.webCaveats}>
      <Text style={styles.webCaveatsTitle}>web — expected differences</Text>
      <Text style={styles.webCaveatsText}>
        Device list always empty; discovery controls are no-ops; startSession
        ignores deviceId and opens the browser picker. showExpandedControls /
        showIntroductoryOverlay / showPlayServicesErrorDialog resolve false.
        setPlaybackRate and queueInsertAndPlayItem reject notSupported. Standby
        is always unknown; suspended/resuming/resumeFailed are never emitted.
        Fake start/end report delivered=false — there is no native boundary to
        drive here, and saying otherwise would make the seam lie.
      </Text>
    </View>
  );
}

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

/**
 * T2 — per-panel error boundary. The probe panels are the first place the
 * hooks (`useMediaStatus` / `useStreamPosition` / `useCastSession`) see real
 * GCK data instead of the jest fake, and an unexpected shape throws in render.
 * Without this, that unmounts the whole tree: blank screen, no cause, and the
 * event log holding every completed row's evidence goes with it.
 *
 * Scoped per panel (not once at the root) so one bad shape costs one panel,
 * and mounted INSIDE the probes section so the event log is never a child of
 * any boundary — the evidence outlives the crash by construction.
 */
class PanelBoundary extends Component<
  { name: string; append: Append; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Route the crash into the event log too: a boundary that only paints
    // inline can be missed while scrolled away, and this row's whole point is
    // that the failure is visible.
    this.props.append(`PANEL CRASH [${this.props.name}]: ${error.message}`);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View testID={`panelError-${this.props.name}`} style={styles.panelError}>
        <Text style={styles.panelErrorText}>
          ⚠ {this.props.name} panel crashed: {error.message}
        </Text>
        <Pressable
          style={[styles.button, styles.resetButton]}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.buttonText}>Reset panel</Text>
        </Pressable>
      </View>
    );
  }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.button, styles.probeButton]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Disposable probes (T3). The duplication was the point while the device pass
// was still discovering the real data shapes; T6 has since folded the only two
// genuinely identical wrappers into `makeProbe` (probeHelpers.ts). The panels
// are `memo`ed because the event log lives in `App` state, so without it every
// `append` re-rendered every mounted panel.
// ---------------------------------------------------------------------------

/**
 * Discovery readout (S1.3) — the only observability for `isRunning()` /
 * `startDiscovery()`, which are documented **iOS-only** public API that no
 * device row has ever executed. It is deliberately inside the probes pane:
 * expanding the pane is not a CastButton tap, so reading it does not perturb
 * what build A gates on (`startDiscoveryAfterFirstTapOnCastButton`).
 *
 * The Android/web values are labelled rather than hidden — the framework owns
 * discovery there, so `isRunning()` reads a constant `false` and the buttons
 * are no-ops. An unlabelled `false` on Android would read as a measurement.
 */
const DiscoveryProbe = memo(function DiscoveryProbePanel({
  append,
}: {
  append: Append;
}) {
  const discoveryManager = GoogleCast.getDiscoveryManager();
  const read = useCallback(
    () => ({
      running: discoveryManager.isRunning(),
      passive: discoveryManager.isPassiveScan(),
      devices: discoveryManager.getDevices().length,
    }),
    [discoveryManager],
  );
  // Sampled at mount, i.e. when the pane is expanded — for 1.3.2 that is
  // "after init, before any CastButton tap".
  const [reading, setReading] = useState(read);
  const sample = useCallback(
    (label: string) => {
      const next = read();
      setReading(next);
      append(
        `discovery: ${label} isRunning=${next.running} passive=${next.passive} devices=${next.devices}`,
      );
    },
    [append, read],
  );

  return (
    <>
      <Text style={styles.panelNote}>
        isRunning={String(reading.running)} passive={String(reading.passive)}{' '}
        devices={reading.devices}
        {Platform.OS === 'ios'
          ? ''
          : `\n(${Platform.OS}: iOS-only API — always false, buttons are no-ops)`}
      </Text>
      <View style={styles.probeRow}>
        <Btn label="Read" onPress={() => sample('read')} />
        <Btn
          label="startDiscovery"
          onPress={() => {
            discoveryManager.startDiscovery();
            sample('after startDiscovery');
          }}
        />
        <Btn
          label="stopDiscovery"
          onPress={() => {
            discoveryManager.stopDiscovery();
            sample('after stopDiscovery');
          }}
        />
      </View>
    </>
  );
});

const MediaProbes = memo(function MediaProbesPanel({
  append,
}: {
  append: Append;
}) {
  const client = useRemoteMediaClient();
  const [fixtureIndex, setFixtureIndex] = useState(0);
  const fixture: MediaFixture = MEDIA_FIXTURES[fixtureIndex]!;

  const run = makeProbe('media: ', append, client);

  return (
    <>
      <Text style={styles.panelNote}>
        fixture: {fixture.label} ({fixture.contentType}, expect{' '}
        {fixture.expectedDuration ?? 'live'}s) · client{' '}
        {client ? 'ready' : 'null'}
      </Text>
      <View style={styles.probeRow}>
        <Btn
          label={`Fixture → ${
            MEDIA_FIXTURES[(fixtureIndex + 1) % MEDIA_FIXTURES.length]!.label
          }`}
          onPress={() => setFixtureIndex(i => (i + 1) % MEDIA_FIXTURES.length)}
        />
        {/* v5-868 diagnostic: pushes a synthetic status down the SAME
            native→JS callback and store reducer a real GCK status uses.
            Lands (pos=9999) => the store path is fine and the native GCK
            callback stopped firing. Does not land => the store is dropping
            pushes (suspect the media slice's `live` gate). */}
        <Btn
          label="Inject status"
          onPress={() => {
            injectFakeMediaStatus().then(
              d => append(`inject media status delivered=${d}`),
              (e: Error) => append(`inject threw: ${e.message}`),
            );
          }}
        />
        <Btn
          label="Load"
          onPress={() =>
            run('loadMedia', () =>
              client!.loadMedia({
                mediaInfo: {
                  contentUrl: fixture.contentUrl,
                  contentType: fixture.contentType,
                  // Sent explicitly: omitting it leaves GCK's MediaInfo.Builder
                  // at STREAM_TYPE_NONE (MediaInfo+toGckMediaInfo.kt uses
                  // `streamType?.let`), whereas the Chrome sender SDK defaults
                  // to BUFFERED — a real cross-platform parity gap worth its
                  // own decision. Note it did NOT fix the idleReason=error seen
                  // during the device pass, so it is not that bug's cause.
                  streamType: 'buffered',
                  // Deliberately NOT sending streamDuration: the receiver
                  // echoes back whatever we send, so declaring it here makes
                  // the `dur=` readout worthless as evidence. Let the receiver
                  // measure it, then check it against `expectedDuration`.
                  metadata: {
                    type: 'movie',
                    title: fixture.title,
                    images: fixture.imageUrl
                      ? [{ url: fixture.imageUrl }]
                      : undefined,
                  },
                },
                autoplay: true,
              }),
            )
          }
        />
        {/* Byte-for-byte the v4 playground's known-good call — contentUrl and
            nothing else. If this plays while "Load" does not, the fault is in
            something we ADD (metadata / contentType / streamType), not in the
            load path itself. */}
        <Btn
          label="Load bare"
          onPress={() =>
            run('loadMedia(bare)', () =>
              client!.loadMedia({
                mediaInfo: { contentUrl: fixture.contentUrl },
              }),
            )
          }
        />
        {/* Isolates TLS/CDN/DNS: plain HTTP from the dev machine.
            Carries metadata, and "Load LAN bare" below does not — the pair is
            what isolates the metadata variable for the notification row (G6),
            same loadMedia path and same single-item queue on both sides. */}
        <Btn
          label="Load LAN"
          onPress={() =>
            run('loadMedia(LAN)', () =>
              client!.loadMedia({
                mediaInfo: {
                  contentUrl: LAN_FIXTURE.contentUrl,
                  contentType: LAN_FIXTURE.contentType,
                  streamType: 'buffered',
                  metadata: { type: 'movie', title: LAN_FIXTURE.title },
                },
              }),
            )
          }
        />
        <Btn
          label="Load LAN bare"
          onPress={() =>
            run('loadMedia(LAN bare)', () =>
              client!.loadMedia({
                mediaInfo: { contentUrl: LAN_FIXTURE.contentUrl },
              }),
            )
          }
        />
        <Btn label="Play" onPress={() => run('play', () => client!.play())} />
        <Btn
          label="Pause"
          onPress={() => run('pause', () => client!.pause())}
        />
        <Btn
          label="Seek +30"
          onPress={() =>
            run('seek+30', () => client!.seek({ position: 30, relative: true }))
          }
        />
        <Btn
          label="Seek 0"
          onPress={() => run('seek0', () => client!.seek({ position: 0 }))}
        />
        {/* #626: stop() must null the media status while the SESSION stays
            alive (v5-82w asserts that premise in the reducer; this is where it
            gets checked against real GCK). */}
        <Btn label="Stop" onPress={() => run('stop', () => client!.stop())} />
        <Btn
          label="Vol 0.3"
          onPress={() => run('vol0.3', () => client!.setStreamVolume(0.3))}
        />
        <Btn
          label="Vol 1.0"
          onPress={() => run('vol1.0', () => client!.setStreamVolume(1))}
        />
        <Btn
          label="Mute"
          onPress={() => run('mute', () => client!.setStreamMuted(true))}
        />
        <Btn
          label="Unmute"
          onPress={() => run('unmute', () => client!.setStreamMuted(false))}
        />
        <Btn
          label="requestStatus"
          onPress={() => run('requestStatus', () => client!.requestStatus())}
        />
        {/* v5-868: reads the store SYNCHRONOUSLY via the façade instead of
            through useSyncExternalStore. If this shows fresh data while the
            hook readout above is stale, the reducer is fine and the store's
            subscriber notification is what broke. */}
        <Btn
          label="Dump status"
          onPress={() => {
            const st = client?.getMediaStatus();
            append(
              `façade getMediaStatus: ${
                st
                  ? `${st.playerState} pos=${st.streamPosition} vol=${st.volume}`
                  : 'null'
              }`,
            );
          }}
        />
        {/* v5-868, the decisive one. `pushes` is counted at the native→JS
            boundary BEFORE the media slice's live gate, so it separates "native
            stopped calling" from "the reducer is dropping" — two faults the
            façade and the hooks render identically. See
            src/debug/storeDiagnostics.ts. */}
        <Btn
          label="Dump store"
          onPress={() =>
            append(`store: ${formatStoreDiagnostics(dumpStoreDiagnostics())}`)
          }
        />
      </View>
    </>
  );
});

const QueueProbes = memo(function QueueProbesPanel({
  append,
}: {
  append: Append;
}) {
  const client = useRemoteMediaClient();
  const status = useMediaStatus();
  const items = status?.queueItems ?? [];

  const run = makeProbe('queue: ', append, client);

  const lastItemId = items.length ? items[items.length - 1]!.itemId : undefined;
  const secondItemId = items.length > 1 ? items[1]!.itemId : undefined;

  return (
    <>
      <Text style={styles.panelNote}>
        queueItems={items.length} current={String(status?.currentItemId)} ids=[
        {items.map(i => i.itemId).join(', ')}]
      </Text>
      <View style={styles.probeRow}>
        {/* LAN variant: on older Chromecast firmware the public HTTPS
            fixtures do not play at all, so the queue rows are unrunnable
            without a local server. */}
        <Btn
          label="queueLoad LAN ×3"
          onPress={() =>
            run('queueLoad(LAN)', () =>
              client!.queueLoad(
                LAN_QUEUE_FIXTURES.map(f => ({
                  mediaInfo: {
                    contentUrl: f.contentUrl,
                    contentType: f.contentType,
                    metadata: { type: 'movie', title: f.title },
                  },
                  autoplay: true,
                })),
                0,
              ),
            )
          }
        />
        <Btn
          label="queueLoad ×3"
          onPress={() =>
            run('queueLoad', () =>
              client!.queueLoad(
                QUEUE_FIXTURES.map(f => ({
                  mediaInfo: {
                    contentUrl: f.contentUrl,
                    contentType: f.contentType,
                    metadata: { type: 'movie', title: f.title },
                  },
                  autoplay: true,
                })),
                0,
              ),
            )
          }
        />
        {/* #626 second half: removing the LAST queue item must null the media
            status in the UI and in useMediaStatus, session still alive. */}
        <Btn
          label="Remove last"
          onPress={() => {
            if (lastItemId === undefined) {
              append('queue: removeLast SKIPPED — queue empty');
              return;
            }
            run('queueRemoveItems(last)', () =>
              client!.queueRemoveItems([lastItemId]),
            );
          }}
        />
        <Btn
          label="Jump to #2"
          onPress={() => {
            if (secondItemId === undefined) {
              append('queue: jump SKIPPED — fewer than 2 items');
              return;
            }
            run('queueJumpToItem(#2)', () =>
              client!.queueJumpToItem(secondItemId),
            );
          }}
        />
        <Btn
          label="Next"
          onPress={() => run('queueNext', () => client!.queueNext())}
        />
        <Btn
          label="Prev"
          onPress={() => run('queuePrev', () => client!.queuePrev())}
        />
        <Btn
          label="Repeat all"
          onPress={() =>
            run('queueSetRepeatMode(all)', () =>
              client!.queueSetRepeatMode('all'),
            )
          }
        />
      </View>
    </>
  );
});

/**
 * Raw hooks readout — deliberately unformatted. This is the first time these
 * hooks render against real GCK payloads rather than the jest fake, so the
 * point is to see the shape, not to present it. "Boom" verifies T2.
 */
const HooksReadout = memo(function HooksReadoutPanel() {
  const castState = useCastState();
  const devices = useDevices();
  const session = useCastSession();
  const device = useCastDevice();
  const status = useMediaStatus();
  const position = useStreamPosition();
  const [boom, setBoom] = useState(false);

  if (boom) {
    throw new Error('deliberate render throw (T2 boundary check)');
  }

  return (
    <>
      <Text style={styles.readout}>useCastState: {castState}</Text>
      <Text style={styles.readout}>useDevices: {devices.length}</Text>
      <Text style={styles.readout}>
        useCastSession: {session?.id ?? 'null'}
      </Text>
      <Text style={styles.readout}>
        useCastDevice: {device?.friendlyName ?? 'null'}
      </Text>
      <Text style={styles.readout}>useStreamPosition: {String(position)}</Text>
      <Text style={styles.readout}>
        useMediaStatus:{' '}
        {status
          ? `${status.playerState} pos=${status.streamPosition} dur=${status.mediaInfo?.streamDuration} vol=${status.volume} muted=${status.isMuted} items=${status.queueItems.length} idle=${status.idleReason}`
          : 'null'}
      </Text>
      <Text style={styles.readout} testID="mediaStatusNullFlag">
        mediaStatus is {status === null ? 'NULL' : 'set'}
      </Text>
      <View style={styles.probeRow}>
        <Btn label="Boom (test boundary)" onPress={() => setBoom(true)} />
      </View>
    </>
  );
});

/**
 * Custom-channel probe (#614). INERT until T1 lands: the default Media
 * Receiver cannot answer a custom namespace, so a silent readout here means
 * "no receiver", not "channels are broken". The registration-time handshake
 * row needs a receiver that sends a message on SENDER_CONNECTED — the listener
 * below is installed at addChannel time by `useCastChannel`, so a message that
 * arrives before the channel is even returned must still land.
 */
const ChannelProbe = memo(function ChannelProbePanel({
  append,
}: {
  append: Append;
}) {
  const onMessage = useCallback(
    (message: string) => append(`channel ← ${message}`),
    [append],
  );
  const channel = useCastChannel(PROBE_NAMESPACE, onMessage);
  const status = useChannelStatus(PROBE_NAMESPACE);

  return (
    <>
      <Text style={styles.panelNote}>
        {PROBE_NAMESPACE}
        {'\n'}channel={channel ? 'registered' : 'null'} status=
        {status
          ? `connected=${status.connected} writable=${status.writable}`
          : 'null'}
      </Text>
      <Text style={styles.panelNote}>
        #614 handshake: expand this panel BEFORE connecting. The hook can only
        call addChannel once a session exists, and the receiver sends{' '}
        {'"hello"'} once, on SENDER_CONNECTED — so that registration is the only
        window to catch it. Expand after connecting and it is already gone.
      </Text>
      <View style={styles.probeRow}>
        <Btn
          label="Send ping"
          onPress={() => {
            if (!channel) {
              append('channel: send SKIPPED — no channel');
              return;
            }
            channel.sendMessage({ type: 'ping', at: Date.now() }).then(
              () => append('channel → ping sent'),
              (e: CastError) => append(`channel → ping rejected ${e.code}`),
            );
          }}
        />
      </View>
    </>
  );
});

const PENDING_CONFIRM_MS = 1500;
const FLUSH_TIMEOUT_MS = 5000;
const LATE_WATCH_MS = 3000;

/**
 * Request-interruption probe (#624 / AGENTS.md invariant 3): a request that is
 * genuinely still in flight when its session is torn down must be flushed —
 * rejected `interrupted`, GCK-cancelled natively — and must never hang.
 *
 * Two variants, because the first one's premise turned out to be wrong on real
 * hardware:
 *
 * - **"blackhole"** loads a URL the receiver's TCP connect goes nowhere on,
 *   CONFIRMS the request is still pending after a fixed window, then tears
 *   down; it reports `INVALID` — not pass — if the request settled early.
 *   On device (2026-08-03) it always reports INVALID, and that is a finding
 *   rather than a flake: a Cast `LOAD` is acknowledged by the RECEIVER as soon
 *   as it accepts the request, ~186 ms, long before it fetches a single byte
 *   of media. An unreachable asset therefore produces a promptly-resolved
 *   request and a `playerState: loading` that fails later — there is no fixture
 *   that keeps a load request itself in flight. Kept because the INVALID
 *   verdict is exactly what stops the row being ticked on a false pass.
 * - **"tight"** is the one that races: it fires `loadMedia` and calls
 *   `endCurrentSession()` synchronously in the SAME tick, without awaiting, so
 *   the request is still in native's pending set when teardown flushes it.
 *   ~186 ms of genuine pendency is a wide window by bridge standards. Expect
 *   `rejected code=interrupted`, exactly once.
 *
 * Known limit, stated so the checklist row isn't over-claimed: a JS promise
 * cannot settle twice, so the `settles` counter proves the JS façade settles
 * once, not that native fired exactly one callback. Native exactly-once is
 * covered by `TrackedCastRequestTest.kt` / the iOS delegate tests; what is
 * device-gated here is settle-promptly-with-interrupted and no crash after.
 */
const FlushProbe = memo(function FlushProbePanel({
  append,
}: {
  append: Append;
}) {
  const client = useRemoteMediaClient();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!client) {
      append('flush: SKIPPED — no client (connect first)');
      return;
    }
    setBusy(true);
    const t0 = Date.now();
    let settles = 0;
    let settled = false;

    client
      .loadMedia({
        mediaInfo: { contentUrl: BLACKHOLE_URL, contentType: 'video/mp4' },
        autoplay: true,
      })
      .then(
        () => {
          settles += 1;
          settled = true;
          append(
            `flush: settle #${settles} RESOLVED after ${
              Date.now() - t0
            }ms (unexpected)`,
          );
        },
        (e: CastError) => {
          settles += 1;
          settled = true;
          append(
            `flush: settle #${settles} rejected code=${e.code} native=${
              e.nativeCode
            } after ${Date.now() - t0}ms`,
          );
        },
      );

    await delay(PENDING_CONFIRM_MS);
    if (settled) {
      append(
        `flush: INVALID — settled within ${PENDING_CONFIRM_MS}ms, teardown never raced it`,
      );
      setBusy(false);
      return;
    }
    append(`flush: pending confirmed at ${Date.now() - t0}ms → tearing down`);

    await GoogleCast.getSessionManager()
      .endCurrentSession(false)
      .then(
        () => append('flush: endCurrentSession accepted'),
        (e: CastError) => append(`flush: endCurrentSession rejected ${e.code}`),
      );

    const deadline = Date.now() + FLUSH_TIMEOUT_MS;
    while (!settled && Date.now() < deadline) {
      await delay(100);
    }
    if (!settled) {
      append(
        `flush: FAIL — still pending ${FLUSH_TIMEOUT_MS}ms after teardown (promise hung)`,
      );
    }

    await delay(LATE_WATCH_MS);
    append(
      `flush: settle count ${LATE_WATCH_MS}ms after teardown = ${settles} (expect 1)`,
    );
    // Deliberately NOT awaited: in the FAIL branch above the request never
    // settles, and awaiting it here would hang the probe forever — leaving the
    // button stuck on "running…" in exactly the case this exists to detect.
    // The handlers attached at creation already observe both outcomes.
    setBusy(false);
  };

  /**
   * The variant that actually interrupts something: no await between the load
   * and the teardown, so the request is still pending natively when
   * `flushPendingRequests` runs.
   */
  const runTight = async () => {
    if (!client) {
      append('flush(tight): SKIPPED — no client (connect first)');
      return;
    }
    setBusy(true);
    const t0 = Date.now();
    let settles = 0;

    client
      .loadMedia({
        mediaInfo: { contentUrl: BLACKHOLE_URL, contentType: 'video/mp4' },
        autoplay: true,
      })
      .then(
        () => {
          settles += 1;
          append(
            `flush(tight): settle #${settles} RESOLVED after ${
              Date.now() - t0
            }ms — teardown lost the race, row not proven`,
          );
        },
        (e: CastError) => {
          settles += 1;
          append(
            `flush(tight): settle #${settles} rejected code=${e.code} native=${
              e.nativeCode
            } after ${Date.now() - t0}ms`,
          );
        },
      );

    // Deliberately NOT awaited and NOT deferred to the next tick.
    GoogleCast.getSessionManager()
      .endCurrentSession(false)
      .then(
        () => append('flush(tight): endCurrentSession accepted'),
        (e: CastError) =>
          append(`flush(tight): endCurrentSession rejected ${e.code}`),
      );

    await delay(FLUSH_TIMEOUT_MS);
    if (settles === 0) {
      append(
        `flush(tight): FAIL — still pending ${FLUSH_TIMEOUT_MS}ms after teardown (promise hung)`,
      );
    }
    await delay(LATE_WATCH_MS);
    append(
      `flush(tight): settle count ${LATE_WATCH_MS}ms after teardown = ${settles} (expect 1)`,
    );
    setBusy(false);
  };

  return (
    <>
      <Text style={styles.panelNote}>
        loads {BLACKHOLE_URL}, then ends the session. Expect: rejected
        `interrupted`, once, within {FLUSH_TIMEOUT_MS}ms. "blackhole" confirms
        pendency first (and reports INVALID if the load settles early — it does:
        the receiver acks a LOAD before fetching); "tight" ends the session in
        the same tick, which is the variant that really races.
      </Text>
      <View style={styles.probeRow}>
        <Btn
          label={busy ? 'running…' : 'Flush: blackhole'}
          onPress={() => {
            if (!busy) {
              run();
            }
          }}
        />
        <Btn
          label={busy ? 'running…' : 'Flush: tight'}
          onPress={() => {
            if (!busy) {
              runTight();
            }
          }}
        />
      </View>
    </>
  );
});

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const sessionManager = GoogleCast.getSessionManager();
  const discoveryManager = GoogleCast.getDiscoveryManager();

  const [state, setState] = useState<CastState>(() =>
    GoogleCast.getCastState(),
  );
  const [playServices] = useState(() => GoogleCast.getPlayServicesState());
  // Cross-platform "can this device cast at all?". Deliberately shown next to
  // playServices: on web the latter reads `success` even in a browser that
  // cannot cast, which is exactly the trap this hook exists to remove.
  const supported = useCastSupported();
  const [devices, setDevices] = useState<readonly Device[]>(() =>
    discoveryManager.getDevices(),
  );
  const [log, setLog] = useState<string[]>([]);
  // Live session id, driven by the session-lifecycle stream — the tier-1
  // Maestro flow asserts on this line after injecting fake events.
  //
  // SEEDED, not started at null. It used to start at null, and that produced
  // the whole `v5-3ll` "JS reload loses the session" signature: after a Fast
  // Refresh this line read `Session: none` beside `Cast state: connected`,
  // which looks like the store disagreeing with itself. It is not — measured
  // on device 2026-08-09, the store still held the session at that instant
  // (`session=true sid=… gen=1`). The events that carry a session id had
  // simply already fired before this component remounted, and nothing here
  // ever read the current one. A display fed only by events cannot show state
  // that predates it.
  const [sessionId, setSessionId] = useState<string | null>(
    () => sessionManager.getCurrentCastSession()?.id ?? null,
  );
  // Device-pass toggle: unmounting the CastButton exercises the overlay's
  // no-anchor → false path (and, on Android, stops the ACTIVE scan trigger).
  const [showCastButton, setShowCastButton] = useState(true);
  // Collapsed by default — see the tier-1 Maestro note in the file header.
  const [showProbes, setShowProbes] = useState(false);

  const seq = useRef(0);
  const append = useCallback((line: string) => {
    const entry = `${++seq.current} · ${line}`;
    console.log(`[SPIKE] ${entry}`);
    setLog(prev => [entry, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    const subs = [
      GoogleCast.onCastStateChanged(s => {
        setState(s);
        append(`castState → ${s}`);
      }),
      discoveryManager.onDevicesUpdated(d => {
        setDevices(d);
        append(`devices → [${d.map(x => x.friendlyName).join(', ')}]`);
      }),
      sessionManager.onSessionStarting(s =>
        append(`starting (${s?.id ?? '—'})`),
      ),
      sessionManager.onSessionStarted(s => {
        setSessionId(s?.id ?? null);
        append(`started (${s?.id ?? '—'})`);
      }),
      sessionManager.onSessionStartFailed((_s, e) =>
        append(`startFailed: ${e?.code} / native ${e?.nativeCode}`),
      ),
      sessionManager.onSessionEnding(s => append(`ending (${s?.id ?? '—'})`)),
      sessionManager.onSessionEnded((_s, e) => {
        setSessionId(null);
        append(`ended${e ? `: ${e.code} / native ${e.nativeCode}` : ''}`);
      }),
      sessionManager.onSessionResuming(() => append('resuming')),
      sessionManager.onSessionResumed(s => {
        setSessionId(s?.id ?? null);
        append(`resumed (${s?.id ?? '—'})`);
      }),
      sessionManager.onSessionResumeFailed((_s, e) =>
        append(`resumeFailed: ${e?.code} / native ${e?.nativeCode}`),
      ),
      sessionManager.onSessionSuspended(() => {
        setSessionId(null);
        append('suspended');
      }),
    ];
    return () => subs.forEach(s => s.remove());
  }, [sessionManager, discoveryManager, append]);

  // Spike 0.2 — a deliberately failing mutation; the caught CastError must carry
  // `code` + `nativeCode` across the Nitro bridge.
  const probeError = async () => {
    try {
      await sessionManager.startSession('bogus-device-id');
      append('probe: startSession(bogus) RESOLVED (unexpected)');
    } catch (e) {
      const err = e as CastError;
      append(
        `probe: rejected code=${err.code} native=${err.nativeCode} msg=${err.message}`,
      );
    }
  };

  const startReal = async (device: Device) => {
    try {
      await sessionManager.startSession(device.deviceId);
      append(`startSession(${device.friendlyName}) accepted`);
    } catch (e) {
      const err = e as CastError;
      append(`startSession rejected: ${err.code} / native ${err.nativeCode}`);
    }
  };

  const endSession = async () => {
    try {
      await sessionManager.endCurrentSession(false);
      append('endCurrentSession accepted');
    } catch (e) {
      const err = e as CastError;
      append(`endCurrentSession rejected: ${err.code} / ${err.nativeCode}`);
    }
  };

  // Log the initial seed once after mount (mirrored to console for logcat).
  useEffect(() => {
    append(
      `init seed: castState=${GoogleCast.getCastState()} playServices=${GoogleCast.getPlayServicesState()} devices=${
        discoveryManager.getDevices().length
      }`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // T3 — native-boundary fake seam: injects synthetic events through the real
  // Nitro callbacks (debug builds only). `delivered=false` means the seam is
  // inactive (release build or transport not initialized).
  const fakeSeam = async (name: string, call: () => Promise<boolean>) => {
    try {
      const delivered = await call();
      append(`fake ${name} delivered=${delivered}`);
    } catch (e) {
      const err = e as Error;
      append(`fake ${name} threw: ${err.message}`);
    }
  };

  // Phase 6.1 — Cast UI one-shots; each logs its boolean resolution (or the
  // typed CastError) into the event log for the device pass.
  const probeShow = async (name: string, call: () => Promise<boolean>) => {
    try {
      const shown = await call();
      append(`${name} → ${shown}`);
    } catch (e) {
      const err = e as CastError;
      append(`${name} rejected: ${err.code} / ${err.message}`);
    }
  };

  const text = [styles.text, isDarkMode && styles.textLight];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.header}>
          {/* The unmount long-press lives on the TITLE, not on the button.
              Wrapped around the CastButton it never fired on Android: the
              native MediaRouteButton consumes the touch (its own long-press
              tooltip wins), so rows 1.1.6 / 1.4.6 — which need the anchor
              gone — were undrivable. Found on device 2026-08-09. */}
          <Pressable onLongPress={() => setShowCastButton(v => !v)}>
            <Text style={[styles.title, isDarkMode && styles.textLight]}>
              react-native-google-cast v5 — spike
            </Text>
          </Pressable>
          {showCastButton ? (
            <CastButton
              style={styles.castButton}
              tintColor={isDarkMode ? '#fff' : '#1a73e8'}
            />
          ) : (
            <Text style={text}>⌫</Text>
          )}
        </View>
        <Text testID="castStateText" style={text}>
          Cast state: {state}
        </Text>
        <Text style={text}>
          Supported: {String(supported)}
          {'  ·  '}Play Services: {playServices}
          {IS_WEB ? ' (android-only — always success here)' : ''}
        </Text>
        <Text style={text}>
          Devices: {devices.length}
          {IS_WEB ? ' (web: always 0 — the browser owns the picker)' : ''}
        </Text>
        {IS_WEB && <WebCaveats />}
        <Text testID="sessionStateText" style={text}>
          Session: {sessionId ?? 'none'}
        </Text>

        {!showProbes && (
          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={probeError}>
              <Text style={styles.buttonText}>Probe error (#12)</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={endSession}>
              <Text style={styles.buttonText}>End session</Text>
            </Pressable>
          </View>
        )}

        {/* Hidden while the probes are open: on a phone-sized screen these
            rows leave the probes pane a ~150px slit, which is unusable for
            both a human and automation. Tier-1 Maestro never opens the probes,
            so its visible surface is unaffected. */}
        {!showProbes && (
          <View style={styles.buttons}>
            <Pressable
              style={styles.button}
              onPress={() =>
                probeShow('showCastDialog', () => GoogleCast.showCastDialog())
              }
            >
              <Text style={styles.buttonText}>Dialog</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                probeShow('showExpandedControls', () =>
                  GoogleCast.showExpandedControls(),
                )
              }
            >
              <Text style={styles.buttonText}>Expanded</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                probeShow('showIntroductoryOverlay', () =>
                  GoogleCast.showIntroductoryOverlay(),
                )
              }
            >
              <Text style={styles.buttonText}>Overlay</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                probeShow('overlay(once:false)', () =>
                  GoogleCast.showIntroductoryOverlay({ once: false }),
                )
              }
            >
              <Text style={styles.buttonText}>Overlay∞</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                probeShow('showPlayServicesErrorDialog', () =>
                  GoogleCast.showPlayServicesErrorDialog(
                    GoogleCast.getPlayServicesState(),
                  ),
                )
              }
            >
              <Text style={styles.buttonText}>PlayServices dialog</Text>
            </Pressable>
          </View>
        )}

        {/* T3 fake seam — no `__DEV__` gate: the CI tier-1 build bundles JS
            with dev=false (debuggableVariants=[]) while staying
            android:debuggable. The native seam is the real gate: in a release
            (non-debuggable) build these buttons just log `delivered=false`. */}
        {!showProbes && (
          <View style={styles.buttons}>
            <Pressable
              testID="injectFakeSessionStarted"
              style={[styles.button, styles.fakeButton]}
              onPress={() =>
                fakeSeam('session started', injectFakeSessionStarted)
              }
            >
              <Text style={styles.buttonText}>Fake start</Text>
            </Pressable>
            <Pressable
              testID="injectFakeSessionEnded"
              style={[styles.button, styles.fakeButton]}
              onPress={() => fakeSeam('session ended', injectFakeSessionEnded)}
            >
              <Text style={styles.buttonText}>Fake end</Text>
            </Pressable>
          </View>
        )}

        {!showProbes &&
          devices.map(d => (
            <Pressable
              key={d.deviceId}
              style={[styles.button, styles.deviceButton]}
              onPress={() => startReal(d)}
            >
              <Text style={styles.buttonText}>▶ {d.friendlyName}</Text>
            </Pressable>
          ))}

        <View style={styles.buttons}>
          <Pressable
            testID="toggleProbes"
            style={[styles.button, styles.probeToggle]}
            onPress={() => setShowProbes(v => !v)}
          >
            <Text style={styles.buttonText}>
              {showProbes ? '▾ Hide probes' : '▸ Probes (device pass)'}
            </Text>
          </Pressable>
        </View>

        {/* Every panel is individually boundaried (T2) and the event log below
            is deliberately OUTSIDE all of them, so a panel crash costs one
            panel and never the evidence. */}
        {showProbes && (
          <ScrollView style={styles.probesBox}>
            {/* First, because the pane clips at ~400px: the S1.3 readout has
                to be legible in a screenshot without scrolling. */}
            <Panel title="Discovery (S1.3, iOS)">
              <PanelBoundary name="Discovery" append={append}>
                <DiscoveryProbe append={append} />
              </PanelBoundary>
            </Panel>
            <Panel title="Media">
              <PanelBoundary name="Media" append={append}>
                <MediaProbes append={append} />
              </PanelBoundary>
            </Panel>
            <Panel title="Queue">
              <PanelBoundary name="Queue" append={append}>
                <QueueProbes append={append} />
              </PanelBoundary>
            </Panel>
            <Panel title="Hooks (raw)">
              <PanelBoundary name="Hooks" append={append}>
                <HooksReadout />
              </PanelBoundary>
            </Panel>
            {/* Gated: registering a namespace the Default Media Receiver
                does not declare tears the session down (nativeCode 2055) and
                makes everything downstream look broken. Enable only with a
                custom receiver — see CHANNEL_PROBE_ENABLED. */}
            {CHANNEL_PROBE_ENABLED && (
              <Panel title="Custom channel (#614)">
                <PanelBoundary name="Channel" append={append}>
                  <ChannelProbe append={append} />
                </PanelBoundary>
              </Panel>
            )}
            <Panel title="Request flush race (#624)">
              <PanelBoundary name="Flush" append={append}>
                <FlushProbe append={append} />
              </PanelBoundary>
            </Panel>
          </ScrollView>
        )}

        <Text style={[styles.logTitle, isDarkMode && styles.textLight]}>
          Event log
        </Text>
        {/* Keyed by the line, not the index (T6). Entries are PREPENDED, so an
            index key shifts every row's content on every append and re-renders
            all 60 `Text`s. The `${n} · ` sequence prefix makes each line unique
            by construction, and `seq` only resets when `log` does. Order is
            unaffected — React renders children in array order regardless of
            keys — so the newest entry stays at offset 0, which is what the
            tier-1 `.*delivered=true.*` regexes read. */}
        <ScrollView style={[styles.logBox, showProbes && styles.logBoxSmall]}>
          {log.map(line => (
            <Text key={line} style={styles.logLine}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#000' },
  content: { flex: 1, padding: 20, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#000' },
  castButton: { width: 28, height: 28 },
  text: { fontSize: 15, color: '#000' },
  textLight: { color: '#fff' },
  // `wrap` is load-bearing, not cosmetic: on a 720px-wide phone the five-button
  // row ran off the right edge and "PlayServices dialog" (row 1.4.7) could not
  // be tapped at all — a checklist row unreachable by a layout accident.
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deviceButton: { backgroundColor: '#188038', marginTop: 6 },
  fakeButton: { backgroundColor: '#9334e6' },
  buttonText: { color: '#fff', fontWeight: '600' },
  logTitle: { fontSize: 15, fontWeight: '600', marginTop: 12, color: '#000' },
  logBox: { flex: 1, backgroundColor: '#1112', borderRadius: 8, padding: 8 },
  // With the probes expanded the log yields most of its height to them; the
  // newest entries are prepended, so the evidence stays on screen either way.
  logBoxSmall: { flex: 0, height: 120 },
  logLine: { fontFamily: 'Courier', fontSize: 12, color: '#888' },

  // --- device-pass probes (disposable; see the T3 note above) ---
  probeToggle: { backgroundColor: '#5f6368' },
  probesBox: { flex: 1, marginTop: 8 },
  probeButton: { paddingVertical: 6, paddingHorizontal: 10 },
  probeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  panel: {
    backgroundColor: '#1111',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  panelTitle: { fontSize: 13, fontWeight: '700', color: '#888' },
  panelBody: { marginTop: 4 },
  panelNote: { fontFamily: 'Courier', fontSize: 11, color: '#888' },
  readout: { fontFamily: 'Courier', fontSize: 11, color: '#888' },
  webCaveats: {
    backgroundColor: '#f0a02022',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0a020',
    padding: 8,
    marginTop: 6,
    gap: 4,
  },
  webCaveatsTitle: { fontSize: 12, fontWeight: '600', color: '#f0a020' },
  webCaveatsText: { fontFamily: 'Courier', fontSize: 11, color: '#c08010' },
  panelError: {
    backgroundColor: '#d9303022',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d93030',
    padding: 8,
    gap: 6,
  },
  panelErrorText: { fontSize: 12, color: '#d93030', fontWeight: '600' },
  resetButton: { backgroundColor: '#d93030', alignSelf: 'flex-start' },
});

// SafeAreaProvider must sit above the SafeAreaView that consumes the insets.
export default function AppRoot() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

import { NitroModules } from 'react-native-nitro-modules'
import type { CastDebug } from '../specs/CastDebug.nitro'
import type { SessionInfo } from '../transport/types'
import type { Device } from '../types/Device'

/**
 * Native-boundary fake seam (T3) — tier-1 E2E helpers.
 *
 * NOT part of the public API and NOT exported from the package barrel: this is
 * a debug-only test seam for driving the real Nitro boundary on an
 * emulator/simulator, where Cast discovery cannot work (official Google Cast
 * limitation). Each helper builds a fixed fixture and delivers it through the
 * `CastDebug.inject*` methods, which invoke the *same* stored
 * `initAndSubscribe` callbacks the real GCK listeners use on `CastTransport` —
 * so the event crosses the genuine native↔JS boundary in both directions
 * (JS → native struct conversion in, native → JS callback out) before it
 * reaches the store, the façades, and the app UI.
 *
 * Every helper resolves `true` only when native actually delivered the event
 * (debug build + live transport); `false` means the seam is inactive.
 */

let cachedDebug: CastDebug | null = null

function getCastDebug(): CastDebug {
  if (cachedDebug == null) {
    cachedDebug = NitroModules.createHybridObject<CastDebug>('CastDebug')
  }
  return cachedDebug
}

/** The synthetic receiver device used by the fake-session fixtures. */
export const FAKE_DEVICE: Device = {
  capabilities: ['VideoOut', 'AudioOut'],
  deviceId: 'fake-device-1',
  deviceVersion: '1',
  friendlyName: 'Fake Living Room TV',
  icons: [],
  ipAddress: '192.0.2.1',
  isOnLocalNetwork: true,
  modelName: 'Fake Chromecast',
}

/** The synthetic live session used by the fake-session fixtures. */
export const FAKE_SESSION: SessionInfo = {
  sessionId: 'fake-session-1',
  device: FAKE_DEVICE,
  deviceVolume: 0.5,
  deviceMuted: false,
}

/**
 * Simulate the receiver appearing on the network, then a session connecting to
 * it: `devices → [FAKE_DEVICE]`, `castState → connected`, `lifecycle started`
 * with {@link FAKE_SESSION}.
 */
export async function injectFakeSessionStarted(): Promise<boolean> {
  const debug = getCastDebug()
  const devices = await debug.injectDevices([FAKE_DEVICE])
  const state = await debug.injectCastState('connected')
  const started = await debug.injectLifecycleEvent({
    type: 'started',
    session: FAKE_SESSION,
  })
  return devices && state && started
}

/** Simulate a clean disconnect: `lifecycle ended`, `castState → notConnected`. */
export async function injectFakeSessionEnded(): Promise<boolean> {
  const debug = getCastDebug()
  const ended = await debug.injectLifecycleEvent({ type: 'ended' })
  const state = await debug.injectCastState('notConnected')
  return ended && state
}

/**
 * Deliver a synthetic media status through the transport's `onMediaStatus`.
 *
 * Diagnostic for the "status goes stale" class of bug (v5-868): injecting while
 * a REAL session is live splits the two possible faults. The injected push
 * takes the *same* native→JS callback and the *same* store reducer as a real
 * GCK status, so if the injected one lands while real ones do not, the fault is
 * upstream in the native GCK callback registration; if neither lands, the store
 * is dropping pushes (e.g. the media slice's `live` gate).
 *
 * The marker position (`9999`) is deliberately implausible so it cannot be
 * mistaken for real playback in a readout.
 */
export async function injectFakeMediaStatus(): Promise<boolean> {
  return getCastDebug().injectMediaStatus({
    playerState: 'playing',
    streamPosition: 9999,
    playbackRate: 1,
    volume: 0.42,
    isMuted: false,
    queueItems: [],
  })
}

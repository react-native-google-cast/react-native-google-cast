/**
 * Fixtures for the Phase 6 device pass (docs/internal/phase6-device-pass-checklist.md).
 *
 * Deliberately explicit — a device row that fails must not leave "was it the
 * fixture?" as a live suspect. Every entry records the exact URL, the content
 * type we send, and the duration `ffprobe` actually measured, so a
 * `MediaStatus.mediaInfo.streamDuration` readout can be checked against a
 * number rather than a vibe.
 *
 * ⚠️ Google's `commondatastorage.googleapis.com/gtv-videos-bucket/**` assets —
 * BigBuckBunny.mp4, ForBigger*.mp4, the whole `sample/` and `CastVideos/` tree
 * that the Cast codelabs and half the internet still link to — now return
 * **HTTP 403**. They are gone, not moved. Loading one gets you a `loadMedia`
 * that RESOLVES (the receiver accepts the request) and then a
 * `playerState: idle` / `idleReason: error` a second later, which reads exactly
 * like a wrapper bug and is not one. Verified 2026-08-02 during the device pass.
 *
 * Dependency plan: the four fixtures below live on four independent hosts
 * (media.w3.org, download.blender.org, test-streams.mux.dev,
 * storage.googleapis.com/shaka-demo-assets) and all were re-verified with a
 * ranged GET + `ffprobe` on 2026-08-02. If one dies, the others are unrelated
 * to it. If several die at once, the problem is the network or the receiver,
 * not the wrapper. Re-verify with:
 *
 *   curl -sIL <url> | head -1
 *   ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 <url>
 */

export interface MediaFixture {
  /** Short label used in the probe UI and the event log. */
  readonly label: string;
  readonly contentUrl: string;
  readonly contentType: string;
  /** Seconds, as measured by ffprobe. `null` for live streams. */
  readonly expectedDuration: number | null;
  readonly title: string;
  readonly imageUrl?: string;
}

/** W3C-hosted Sintel trailer. The most durable host of the four. */
export const PRIMARY: MediaFixture = {
  label: 'Sintel trailer (W3C)',
  contentUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  contentType: 'video/mp4',
  expectedDuration: 52.2,
  title: 'Sintel (trailer)',
};

/** Long fixture — 10½ minutes, so seeking and queue rows have real headroom. */
export const LONG: MediaFixture = {
  label: 'Mux test HLS (10m)',
  contentUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  contentType: 'application/x-mpegURL',
  expectedDuration: 634.6,
  title: 'Mux HLS test stream',
};

/** Same content as PRIMARY, different host + higher bitrate. */
export const FALLBACK: MediaFixture = {
  label: 'Sintel 1080p (Blender)',
  contentUrl:
    'https://download.blender.org/durian/trailer/sintel_trailer-1080p.mp4',
  contentType: 'video/mp4',
  expectedDuration: 52.2,
  title: 'Sintel (trailer, 1080p)',
};

/** Fourth host and a second adaptive format — isolates codec/CDN faults. */
export const HLS: MediaFixture = {
  label: 'Shaka Angel One (HLS)',
  contentUrl:
    'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
  contentType: 'application/x-mpegURL',
  expectedDuration: 60,
  title: 'Angel One (HLS)',
};

/** Cycled by the media panel's fixture button, in fallback order. */
export const MEDIA_FIXTURES: readonly MediaFixture[] = [
  PRIMARY,
  LONG,
  FALLBACK,
  HLS,
];

/** Three distinct items so queue reorder/remove/jump rows are unambiguous. */
export const QUEUE_FIXTURES: readonly MediaFixture[] = [PRIMARY, FALLBACK, HLS];

/**
 * Plain-HTTP media served from your dev machine on the LAN. Loading this
 * removes TLS, DNS, CDNs and redirects from the picture in one step, which is
 * the fastest way to tell "the receiver cannot fetch this asset" apart from
 * "the wrapper sent a bad payload" — especially with older Chromecast firmware,
 * whose TLS stack and root-CA bundle can fail on modern HTTPS hosts.
 *
 * Set the IP to your machine, then serve something next to it:
 *
 *   ffmpeg -f lavfi -i testsrc=size=640x360:rate=25:duration=600 \
 *          -f lavfi -i sine=frequency=440:duration=600 \
 *          -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p \
 *          -c:a aac -movflags +faststart test.mp4
 *   python3 -m http.server 8000 --bind 0.0.0.0
 *
 * Baseline/L3.0 + yuv420p + faststart is the most broadly decodable H.264 a
 * Cast device will accept, so a failure here is not a codec-support question.
 */
export const LAN_FIXTURE: MediaFixture = {
  label: 'LAN (plain HTTP)',
  contentUrl: 'http://192.168.1.40:8000/test.mp4',
  contentType: 'video/mp4',
  // 10 minutes: long enough that pause/seek/stop rows have real headroom. A
  // 30 s clip finishes before you can drive the controls.
  expectedDuration: 600,
  title: 'LAN test pattern',
};

/**
 * Three distinct LAN items (30 s / 15 s / 20 s, so the queue order is readable
 * from `useMediaStatus` alone) for running the queue rows on hardware where the
 * public HTTPS fixtures will not play. Serve them alongside `test.mp4`.
 */
export const LAN_QUEUE_FIXTURES: readonly MediaFixture[] = [
  LAN_FIXTURE,
  {
    ...LAN_FIXTURE,
    label: 'LAN #2',
    contentUrl: LAN_FIXTURE.contentUrl.replace('test.mp4', 'test2.mp4'),
    expectedDuration: 15,
    title: 'LAN #2 (15s)',
  },
  {
    ...LAN_FIXTURE,
    label: 'LAN #3',
    contentUrl: LAN_FIXTURE.contentUrl.replace('test.mp4', 'test3.mp4'),
    expectedDuration: 20,
    title: 'LAN #3 (20s)',
  },
];

/**
 * A URL the receiver can neither fetch nor fail fast on: 10.255.255.1 is
 * RFC1918 space that a home LAN routes nowhere, so the TCP connect blackholes
 * (SYN dropped) instead of being refused. That is what keeps the `loadMedia`
 * request genuinely in flight long enough for the flush probe to race a real
 * teardown against it — a fixture that 404s would settle instantly and the
 * probe would pass green without ever having raced anything.
 */
export const BLACKHOLE_URL = 'http://10.255.255.1/never-settles.mp4';

/**
 * Namespace for the custom-receiver channel rows (T1).
 *
 * Must stay identical to `NAMESPACE` in
 * `docs/internal/cast-receiver/receiver.html` — change them together or not at
 * all. That receiver declares this namespace and is deployed to
 * https://react-native-google-cast.github.io/react-native-google-cast/cast-receiver/
 * as app id `EA48D3FC`, which is what this app now launches.
 */
export const PROBE_NAMESPACE = 'urn:x-cast:com.reactnative.googlecast.probe';

/**
 * Whether to mount the custom-channel probe.
 *
 * `true` since 2026-08-04: the playground points at `EA48D3FC` (Android
 * manifest meta-data, iOS `GCKDiscoveryCriteria`), whose receiver declares
 * {@link PROBE_NAMESPACE}. **It is only safe while those two agree.** Point
 * this app back at the Default Media Receiver and this must go back to `false`
 * in the same change.
 *
 * That coupling is not cosmetic. Registering a namespace the receiver does not
 * declare makes the **Default Media Receiver tear the whole session down** —
 * observed on 2026-08-02 as `ended: failed / nativeCode 2055` a few seconds
 * after connecting, which then cascaded into `startSession` rejecting
 * `appNotFound` and every `loadMedia` reporting `idleReason: error`. It cost
 * most of a device pass and looked for all the world like a broken media
 * pipeline. With the probe unmounted, the very same build played media first
 * try.
 *
 * The lesson generalises to consumers, and belongs in the docs: a custom
 * channel requires a custom receiver that declares the namespace. There is
 * nothing to test against the Default Media Receiver.
 */
export const CHANNEL_PROBE_ENABLED = true;

# Phase 6 — device pass checklist (bead v5-8hq.6)

Every v5 code lane is merged and every CI gate is green. What has **never run**
is the real-transport layer: apart from the Phase 3 lifecycle spike
(`phase3-native-spike-checklist.md`), nothing in v5 has touched real GCK. Media,
queue, hooks, channels, notifications and the web transport are all at zero
real-transport coverage. This document is the gate that closes that.

**How to use it.** Run the sessions in order — S1 first because Android's virgin
install is the only perishable state in the whole pass. Fill in the evidence
header before the first row. A row is ✅ only with recorded evidence (a log line,
a screenshot, a `logcat` excerpt); "looked fine" is not evidence.

> **A deferral inside the must-pass list blocks the beta tag.** That was decided
> up front, while nothing was under pressure. An exception granted later by the
> person who wants through the gate is not a gate.

---

## Run log — 2026-08-02, Android (partial)

Ran against commit `59569d1` + the harness changes on this branch. Device: **moto
g05, Android 15 (API 35)**, `ZY32KXN6T3`. Receiver: **"Office TV"** (`md=Chromecast`,
`fn=Office TV`), same /24 as the Mac (`192.168.1.40` / phone `.66`, SSID
`Zyxel_BB21`). Driven over `adb` (taps + `uiautomator dump` + `logcat`).

### Confirmed ✅

| Row                               | Evidence                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1.1 cold-launch seed            | `init seed: castState=noDevicesAvailable playServices=success devices=1`                                                                                                                                     |
| **1.1.3 (Phase 3 finding #2)**    | **`devices=1` at init on real hardware** — the emulator reported `devices=0`. `readDevices()` / `CastDevice.getFromBundle(route.extras)` populates correctly on a physical device. Finding #2 is **closed**. |
| 1.1.2 CastButton → chooser        | Opens the GCK chooser listing "Office TV" — **after** the safe-area fix below. Verified by automation and by hand.                                                                                           |
| 1.1.4 connect + ordered lifecycle | `castState → connecting`, `starting (—)`, `castState → connected`, `started (<id>)` — in order, repeatedly                                                                                                   |
| 1.1.5 ended carries `nativeCode`  | `ended: failed / native 2155` and `native 2055` — real numeric codes across the bridge                                                                                                                       |
| reconnect generation              | `2213040b…` → `73e7c1e6…` → `51622cef…`, new id per reconnect                                                                                                                                                |
| 1.4.2 `showCastDialog()`          | `→ true`, chooser opens                                                                                                                                                                                      |
| 2.2.12 hooks vs real GCK          | `useCastState/useDevices/useCastSession/useCastDevice/useMediaStatus/useStreamPosition` all populate; **no error boundary fired** — T2's premise held against real payloads                                  |
| channel registers                 | `channel=registered status=connected=true writable=true` (Android register-once, as documented). The **handshake** row still needs T1.                                                                       |

### Fixed during the pass

1. **Google's `gtv-videos-bucket` sample assets are dead (HTTP 403).** See the
   banner in `example/probeFixtures.ts`. Symptom is a `loadMedia` that RESOLVES
   then `idleReason: error` — reads exactly like a wrapper bug. Replaced with
   four fixtures on four independent hosts, durations measured with `ffprobe`.
2. **The harness had no working safe area.** It used react-native's deprecated
   `SafeAreaView`, which is a **no-op on Android**, leaving the header — and the
   CastButton — under the status bar, where most taps were swallowed. The
   CastButton was wrongly suspected of being broken. Now uses
   `react-native-safe-area-context`. This also removed a phantom duplicate
   "Office TV" row (`devices=2` → `1`).
3. **The probe was sending `streamDuration`**, which the receiver echoes back —
   making the `dur=` readout worthless as evidence. Removed; the receiver's own
   value is now checked against `expectedDuration`.

### ⭐ Root cause of the media failures — the harness was sabotaging itself

**Registering a custom channel against the Default Media Receiver tears the
session down.** The probe panel mounted `useCastChannel(PROBE_NAMESPACE)` as
soon as it was expanded; the DMR does not declare that namespace, so a few
seconds after connecting the receiver dropped the connection:
`ended: failed / nativeCode 2055`. Everything downstream then looked broken —
`startSession` rejecting `appNotFound`, every `loadMedia` reporting
`idleReason: error`, the TV briefly showing a loading state and falling back to
the Chromecast backdrop.

With the channel probe unmounted, the **same build played media on the first
try**:

```
7 · media: loadMedia(LAN) resolved
useMediaStatus: idle pos=0 dur=30 vol=1 muted=false items=0 idle=finished
192.168.1.137 - - [02/Aug/2026 18:06:41] "GET /test.mp4 HTTP/1.1" 200
```

`dur=30` is the **receiver's own measurement** (we no longer send
`streamDuration`) and matches the fixture exactly; `idle=finished` means the 30 s
clip played to completion. **G3 media load/play is confirmed working on
Android.**

The probe is now gated behind `CHANNEL_PROBE_ENABLED` in
`example/probeFixtures.ts`, default `false`, with the reason written down. Turn
it on only once T1's receiver is registered.

**This generalises to consumers and belongs in the Phase 7 docs:** a custom
channel requires a custom receiver that declares the namespace. Pointed at the
Default Media Receiver, `addChannel` does not merely no-op — it kills the
session. Android reports the channel as `connected=true writable=true`
(register-once, v4 parity) right up until the receiver hangs up, so the sender
side gives no warning at all.

### ~~🔴 P1 BUG — the media status stream goes stale after the first update~~ → NOT A BUG (2026-08-03)

> **Resolved on 2026-08-03: this was a misreading of the Cast protocol, not a
> defect.** `MEDIA_STATUS` is broadcast on _transitions only_ — a receiver
> playing steadily sends nothing for minutes. A cached `streamPosition` is a
> snapshot at the last transition; `useStreamPosition` extrapolates between
> them, which is why it exists. See the 2026-08-03 run log below for the
> measurement, and the closed bead `v5-868` for the corrected evidence chain
> (including the `delivered=true` inference that was wrong). The original
> analysis is kept below because the _shape_ of the reasoning error is worth
> not repeating.

With a 10-minute LAN fixture playing, every command **resolved** and the
receiver acted on them, but `useMediaStatus` froze at the first post-load status
and never moved again:

```
18:36:52  media: loadMedia(LAN) resolved
18:37:45  media: pause resolved     → useMediaStatus: paused pos=51.904 dur=600 vol=1
18:38:26  media: play resolved      → useMediaStatus: paused pos=51.904 dur=600 vol=1
18:39:11  media: seek+30 resolved   → useMediaStatus: paused pos=51.904 dur=600 vol=1
18:39:56  media: vol0.3 resolved    → useMediaStatus: paused pos=51.904 dur=600 vol=1
18:41:06  media: requestStatus resolved → paused pos=51.904 dur=600 vol=1
```

Ground truth from **GCK's own expanded controller** at 18:42, which reads the
receiver independently of our store: **`03:40 / 10:00`, with a "Pause" button**
— i.e. actually _playing_ at ~220 s. Our hook said `paused` at 51.9 s.

So the receiver executed play/seek/volume correctly; **the JS-side media status
simply stopped being updated.** Note `requestStatus()` did not repair it either,
which points at the emit/subscribe path rather than at GCK not sending updates.

Impact: every consumer building a media UI on `useMediaStatus` /
`RemoteMediaClient.getMediaStatus()` shows stale state after the first change.
This is a release blocker and wants its own bead. Suspects to start from:
`attachMediaCallback` / `observedClient` identity in `HybridCastTransport.kt`
(the early-return when `observedClient === client`), and whether the media
callback survives the first status transition.

Confirmed working before it goes stale: `dur=600` matches the fixture exactly,
`pos=51.904` is a real position, `items=1`, and `useStreamPosition` ticks — so
load, the first status push, and the progress ticker are all fine.

### Media rows confirmed on the LAN fixture

| Row                     | Result                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 2.2.1 `loadMedia` plays | ✅ `dur=600` = fixture duration, real `pos` advancing                                                               |
| 2.2.2 pause             | ✅ `playerState: paused`                                                                                            |
| `useStreamPosition`     | ✅ ticks against real playback                                                                                      |
| play / seek / volume    | ✅ resolve and take effect — the status **does** reflect them; see the 2026-08-03 log for why this looked otherwise |

### ⚠️ This Chromecast cannot play the public HTTPS fixtures

Same session, same build, back to back:

| Fixture                                                       | Result                                   |
| ------------------------------------------------------------- | ---------------------------------------- |
| `http://<mac>:8000/test.mp4` (plain HTTP, LAN)                | ✅ plays, `dur` correct, `idle=finished` |
| `https://media.w3.org/…/trailer.mp4`                          | ❌ `idleReason: error` immediately       |
| `https://storage.googleapis.com/shaka-demo-assets/…/hls.m3u8` | ⚠️ stalls in `loading`, never plays      |

Device is a first/second-generation Chromecast, firmware **1.56.291998**
(`http://<ip>:8008/setup/eureka_info`). The pattern — plain HTTP fine, modern
HTTPS hosts not — is consistent with an old TLS stack / root-CA bundle. **Not a
wrapper problem**, but it means media rows on this hardware must use
`LAN_FIXTURE` / `LAN_QUEUE_FIXTURES`. Retest fixtures on newer hardware before
concluding anything about a given asset.

---

## Run log — 2026-08-03, Android (media, queue, flush)

Same rig: moto g05 (`ZY32KXN6T3`), Chromecast "Office TV" fw 1.56.291998,
`LAN_FIXTURE` / `LAN_QUEUE_FIXTURES` off `python3 -m http.server 8000`.

### ⭐ `v5-868` closed as NOT A BUG — and how the wrong turn happened

The instrument that settled it: **`CastStore.getMediaPushCount()`**, a counter
incremented at the native→JS boundary _before_ the media slice's `live` gate,
read on device through `src/debug/storeDiagnostics.ts` and a "Dump store"
button. It separates two faults the façade and the hooks render identically —
"native stopped calling" vs "the reducer is dropping".

| Action                    | Store dump                              |
| ------------------------- | --------------------------------------- |
| connected, nothing loaded | `pushes=10 live=true player=null`       |
| `loadMedia(LAN)`          | `pushes=18 playing pos=0.296`           |
| +6 s, +12 s (playing)     | `pushes=18 pos=0.296` ← the "staleness" |
| `pause`                   | `pushes=19 paused pos=134.174`          |
| `play`                    | `pushes=20 playing pos=134.259`         |
| `requestStatus()`         | `pushes=22 playing pos=164.46`          |

Every transition arrives, and the position advances correctly — `134.259 →
164.46` is ~30 s of real elapsed time. The counter freezing _between_
transitions is the Cast protocol working as designed.

**The reasoning error worth not repeating.** The previous session concluded
"native delivers, JS does not apply" from `CastDebug.injectMediaStatus`
resolving `delivered=true`. But the Android seam emits via
`emitMediaStatus = { this.onMediaStatus?.invoke(it) }`
(`HybridCastTransport.kt:142`) and resolves `true` whenever the _sink_ is
attached — regardless of whether `onMediaStatus` is null. `delivered=true`
proved the sink existed and nothing else. Two passing JS store tests were then
written against a suspect that was never implicated.

### 🔴 REAL P0 found instead — id-only queue items crashed the app (`v5-kbd`, fixed)

```
FATAL EXCEPTION: main
java.lang.IllegalArgumentException: GckMediaQueueItem.media must not be null
  at GckMediaQueueItem+toMediaQueueItem.kt:13
  at GckMediaStatus+toMediaStatus.kt:20
  at HybridCastTransport.emitMediaStatus(:848)
  at attachMediaCallback$callback$1.onMetadataUpdated(:831)
  ← RemoteMediaClient.onMessageReceived   (real GCK MEDIA_STATUS, main thread)
```

`queueLoad` 3 items → `queueRemoveItems(last)` → **host app process death.** The
receiver names queue entries by `itemId` alone until it populates their media;
Android's `MediaQueueItem.getMedia()` is `@Nullable` and correctly returned
null, and our `requireNotNull` threw straight out of a GCK main-thread callback.

Fixed by `toMediaQueueItemOrNull()` + `mapNotNull` at both call sites. The type
keeps `mediaInfo` required on purpose: iOS declares
`GCKMediaQueueItem.mediaInformation` **nonnull** (verified in the GCK 4.8.4
header, inside `NS_ASSUME_NONNULL`), so weakening the shared type would push an
Android-only transient onto every consumer forever. Re-verified on device after
rebuild: four "Remove last" taps, pid stable throughout.

Not unit-testable — `GckMediaQueueItem.Builder` requires a `MediaInfo`, so an
id-only item cannot be constructed on the sender side at all.

### Rows confirmed

| Row                                    | Result                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| G3 media load / play / pause / stop    | ✅ `pushes` and `playerState` track every command                                |
| `requestStatus()`                      | ✅ forces a fresh status (`pushes` +2)                                           |
| Queue: `queueLoad` ×3                  | ✅ resolved; `queueItems=2 current=2 ids=[2,3]` — auto-advanced past item 1      |
| Queue: jump / next / prev / repeat-all | ✅ all four resolved; repeat-all re-queued (`ids=[2,3,4]`)                       |
| Queue: `queueRemoveItems` ×3 → empty   | ✅ resolved; 4th correctly reported "queue empty"                                |
| Cold start into an active cast         | ✅ reconnect resumed the **same** `sessionId`, `useStreamPosition` live at 395 s |

### ⚠️ G4 (#626) — the premise is wrong on this receiver

The row expected `stop()` and remove-last-queue-item to **null**
`useMediaStatus`. On the Default Media Receiver neither does:

| After                  | `useMediaStatus`                                                    |
| ---------------------- | ------------------------------------------------------------------- |
| `stop()`               | `idle pos=0 items=0 idle=cancelled` — **not null**, session alive   |
| remove last queue item | `idle pos=0 items=0 idle=interrupted` — **not null**, session alive |

The v5-82w null-clear path is still correct for a genuinely null GCK
`mediaStatus`, but that is not what this receiver produces. **Consumer-facing
consequence**, now documented on `useMediaStatus`: detect "nothing is playing"
with `playerState === 'idle'`, not `status === null`. The half of the row that
_was_ the point — the session survives `stop()` (v5-82w's shipped premise) —
is ✅ confirmed.

### ⚠️ G5 (#624) — the original probe cannot race, by construction

"Flush: blackhole" self-reported **INVALID**: `loadMedia` to a blackholed URL
**resolved in 186 ms**. A Cast `LOAD` is acknowledged by the _receiver_ as soon
as it accepts the request, long before it fetches any media — so an unreachable
asset yields a promptly-resolved request plus a `playerState: loading` that
fails later. **No fixture can keep a load request itself in flight.** The
probe's `INVALID` verdict is exactly what stopped this being ticked green on a
false pass.

Added **"Flush: tight"**, which fires `loadMedia` and calls
`endCurrentSession()` synchronously in the same tick, so the request is still in
native's pending set when `flushPendingRequests` runs.

**G5 ✅ — run 2026-08-03:**

```
10 · ending (e4e19b97-f3ff-44cb-b6ec-330ee82dae69)
11 · flush(tight): settle #1 rejected code=interrupted native=undefined after 65ms
12 · ended: failed / native 2161
13 · flush(tight): endCurrentSession accepted
15 · flush(tight): settle count 3000ms after teardown = 1 (expect 1)
```

Rejected `interrupted` in **65 ms** (budget 5000), settle count **1** three
seconds after teardown — no late callback. The rejection lands between `ending`
and `ended`, i.e. via `onSessionEnded`'s `flushPendingRequests` before it emits
`ENDED`; no `suspended` appears, so exactly one of the two flush call sites
handled it. `native=undefined` is correct — `interrupted` is synthesised
locally, not a GCK status code.

**Scope, stated so the row is not over-claimed:** a JS promise cannot settle
twice, so this proves settle-promptly-with-`interrupted`-and-no-crash, not that
native fired exactly one callback. Native exactly-once remains covered by
`TrackedCastRequestTest.kt`.

### Still to run on Android

- **S1.4 one-shots** — overlay once/∞ persistence, no-anchor → false,
  PlayServices dialog, and spike 0.3 (Fast Refresh + forced reconnect).
- **S2.3 notifications** — needs
  `adb shell pm grant com.castexample android.permission.POST_NOTIFICATIONS`
  first (see the S2.3 block below).

Handy: the device-pass driver used for these runs is disposable and lives in the
session scratchpad, not the repo. One gotcha worth knowing — **`uiautomator
dump` returns stale text** for this RN tree (it disagreed with a screenshot
taken in the same second). Use it for _coordinates_, read _values_ off
screenshots. Probe buttons below the probes pane's ~400 px clip report inverted
bounds; scroll within `y ∈ [500, 870]` first.

### Other observations to chase

- **Duplicate device entries** (`v5-6l1`) — now seen at **cold launch** too
  (`init seed: … devices=2`, before any session), so "connected route plus
  discovered route" is not the whole story.
- **JS reload loses the session** (`v5-3ll`) — reproduced and narrowed:
  `castState=connected` and `currentSession=null` disagree _inside one
  `InitialSnapshot`_, built in a single `runOnMain` block. Since
  `CastSession.toSessionInfo()` returns null on exactly one condition
  (`castDevice == null`), the next step is to log whether `currentCastSession`
  is null despite `castState==CONNECTED`, or non-null with a null `castDevice`.
  Both beads share a suspect: Fast Refresh re-evaluates `castStore.singleton`,
  creating a **new** `HybridCastTransport` while the old one keeps its GCK
  listeners.

### Two real converter bugs found by the v4 comparison

`contentId` was **not defaulting to `contentUrl`** on either native platform,
though `MediaInfo.contentId`'s own doc comment promises exactly that and v4
implemented it (`RNGCMediaInfo.fromJson`: `json.hasKey("contentId") ? … :
json.getString("contentUrl")`).

- Android used the no-arg `MediaInfo.Builder()` whenever `contentId` was absent.
- iOS only assigned `builder.contentID` when `contentId` was explicitly supplied.
- The **web** transport was correct (`info.contentId ?? info.contentUrl`).

Both are fixed. The Default Media Receiver keys off `contentId`, so this would
have bitten any consumer following our own documented minimal example.

Separately noted, not yet changed: **`streamType` does not default to
`buffered`** on either native platform (`streamType?.let` / `if let streamType`),
while the Chrome sender SDK defaults to `BUFFERED`. That is a real
cross-platform parity gap and deserves its own decision.

### 🔵 Still open — web transport

The owner reproduced the same media failure through `web-example/` in Chrome.
The web harness has no channel probe, so it is **not** the 2055 cause — but the
receiver may simply have been in the state the phone had put it in. Re-test web
now that the channel probe is gated. (Chrome on the dev Mac also intermittently
reported `noDevicesAvailable` while the phone saw the device fine.)

### Superseded — earlier "G3 media playback fails" analysis

`loadMedia` **resolves**, then `useMediaStatus` reports
`idle … dur=undefined idle=error` every time. Not yet explained.

Ruled out so far:

- **Fixture** — fails identically on 3 URLs across 3 hosts (all verified 200/206).
- **`streamType`** — GCK's `MediaInfo.Builder` defaults to `STREAM_TYPE_NONE`
  when the app omits it (`MediaInfo+toGckMediaInfo.kt:27` is
  `streamType?.let { … }`). Setting `streamType: 'buffered'` explicitly did **not**
  fix it. _(Worth deciding separately whether the wrapper should default to
  `BUFFERED` — the Chrome sender SDK does, so this is a real cross-platform
  parity gap even though it is not this bug.)_
- **Receiver app id** — logcat confirms `appId=CC1AD845` (Default Media Receiver).
- **Network** — Chromecast reachable via mDNS from the Mac, same subnet, and the
  owner reports the TV has internet and looks healthy.

Also unexplained and possibly the same root cause:

- `SessionManager.startSession(deviceId)` (our green device button) rejects
  **`appNotFound`**, while selecting the same device from the GCK chooser
  connects fine. A documented public API failing on real hardware — needs its own
  investigation.
- Sessions sometimes drop ~10–60 s in with `ended: failed / native 2155` / `2055`.

**Next decisive test:** load the same URL through `web-example/` (Chrome sender
SDK → same receiver). If it also fails, the receiver/asset is the problem; if it
plays, the fault is in the Android `loadMedia` path.

---

## Evidence header — fill in before S1.1

| Field                                   | Value                                                               |
| --------------------------------------- | ------------------------------------------------------------------- |
| Commit SHA under test                   |                                                                     |
| Date                                    |                                                                     |
| iOS GCK SDK                             | `google-cast-sdk 4.8.4` (Podfile.lock) — confirm unchanged          |
| Android GCK SDK                         | `play-services-cast-framework 22.0.0` — confirm unchanged           |
| Android device + OS                     |                                                                     |
| iPhone + iOS (S3 only)                  |                                                                     |
| Simulator + iOS (S1.2/1.3)              |                                                                     |
| Chromecast model                        |                                                                     |
| Chromecast firmware                     |                                                                     |
| Network (SSID, band, AP isolation off?) |                                                                     |
| Media fixture used                      | see `example/probeFixtures.ts` — record which one, and any fallback |
| Custom receiver app id                  | T1; `—` until registered                                            |
| Raw logs                                | path/gist of `adb logcat \| grep SPIKE` and the iOS console         |

---

## The gate

### Non-deferrable — each backs a documented public API

| #   | Row                                                         | Where                                  | Android                                       | iOS     |
| --- | ----------------------------------------------------------- | -------------------------------------- | --------------------------------------------- | ------- |
| G1  | Session lifecycle, ordered, both platforms                  | S1.1, S1.2                             | ✅ 08-02                                      | ⬜ open |
| G2  | Discovery — real device appears in the list                 | S1.1, S1.2                             | ✅ 08-02                                      | ⬜ open |
| G3  | Media load / play / stop                                    | S2.2                                   | ✅ 08-03                                      | ⬜ open |
| G4  | ~~#626 null-clear~~ → **#626 idle-clear** (see note)        | S2.2                                   | ✅ 08-03 _against the amended definition_     | ⬜ open |
| G5  | #624 request interruption (flush race)                      | S2.2                                   | ✅ 08-03 `interrupted` @65 ms, settle count 1 | ⬜ open |
| G6  | Android notifications, **incl. Android 14+**                | S2.3                                   | ⬜ open                                       | n/a     |
| G7  | CastChannel registration-time handshake                     | S2.2                                   | ⬜ blocked on T1 (custom receiver)            | ⬜ open |
| G8  | Web smoke — launcher → connect → load → status → disconnect | Web (gates the **tag**, not this bead) | ⬜ open                                       |         |

> **G4 — the row's acceptance criterion was wrong and has been amended.** It
> asked for `useMediaStatus` to go **null** after `stop()` and after removing the
> last queue item. On the Default Media Receiver neither does: both leave a
> non-null status reporting `playerState: 'idle'` (`idleReason` `'cancelled'` /
> `'interrupted'`), verified 2026-08-03. `null` means "no session, or nothing
> ever loaded"; `idle` means "loaded, now stopped". The amended row is: **the
> cached status must be cleared of the finished media and the session must stay
> alive** — both ✅. The v5-82w null-push path stays correct for a genuinely null
> GCK `mediaStatus`; this receiver simply never produces one. Consumer guidance
> is now on `useMediaStatus`'s doc comment. Amending a gate row is exactly what
> the "no exceptions granted by the person who wants through the gate" rule is
> about, so it is recorded here rather than quietly ticked: the change is to the
> _criterion_, on receiver evidence, not to the _standard_.

### May defer, with a written reason recorded in the row

`resumeFailed` · exotic notification permutations · the scan-stop row if
discovery observability is not added · reconnect-generation edge cases.

---

## S1 — no signing, no harness changes

Runs against `example/App.tsx` with the **probes section collapsed** — i.e. the
app exactly as tier-1 Maestro sees it.

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
yarn example start                    # Metro, own terminal
adb uninstall com.castexample && yarn example android
adb logcat | grep SPIKE
```

### S1.1 — Android, virgin install (**run first — perishable**)

| #     | Row                                                                                                                                                                                                                                                                                 | Status | Evidence |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 1.1.1 | Cold launch: `init seed:` line shows `castState`, `playServices`, `devices=N`                                                                                                                                                                                                       |        |          |
| 1.1.2 | CastButton mount triggers ACTIVE scan; the real Chromecast appears in the device list                                                                                                                                                                                               |        |          |
| 1.1.3 | **Phase 3 finding #2**: `readDevices()` / `CastDevice.getFromBundle(route.extras)` populates on real hardware (the emulator showed `devices=0` while `castState` reached `notConnected`)                                                                                            |        |          |
| 1.1.4 | Tap the device → ordered `starting → started`; `Session:` shows a real id                                                                                                                                                                                                           |        |          |
| 1.1.5 | End session → ordered `ending → ended`; `ended` carries a numeric `nativeCode`                                                                                                                                                                                                      |        |          |
| 1.1.6 | ⚠️ **Scan-stop.** Long-press the header unmounts the CastButton (App.tsx). A frozen device list looks identical whether the scan stopped or the UI went stale. **Do not tick this row without discovery-state observability.** Defer with a reason, or add the observability first. |        |          |

### S1.2 — iOS Simulator, build A (default `GCKCastOptions`)

No signing. Per `phase3-native-spike-checklist.md:11-15` a full session lifecycle
against a real Chromecast already ran on the iPhone 17 Simulator — the Simulator
is not a blocker here. Only the LNA-prompt rows need real hardware (S3), because
Apple's simulators never present that prompt.

```bash
cd example && bundle install && cd ios && bundle exec pod install
yarn example ios
```

> `pod install` may rewrite the `hermes-engine` line under `SPEC CHECKSUMS` in
> `example/ios/Podfile.lock`. That checksum is environment-dependent (it differs
> between CI and at least one dev machine) — **do not commit it**; revert that
> one line and keep the rest.

| #     | Row                                                                                                                                                                          | Status | Evidence |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 1.2.1 | Cold-launch seed line                                                                                                                                                        |        |          |
| 1.2.2 | Device list stays empty until the first CastButton tap — GCK's own `startDiscoveryAfterFirstTapOnCastButton` logic, **not** the OS permission, so it is Simulator-observable |        |          |
| 1.2.3 | Chooser → connect → ordered lifecycle                                                                                                                                        |        |          |
| 1.2.4 | Disconnect → reconnect produces a new session generation (id changes)                                                                                                        |        |          |

### S1.3 — iOS Simulator, build B

Build B is a **build configuration**, not a source edit:

```bash
cp example/ios/local.xcconfig.example example/ios/local.xcconfig
cd example/ios && bundle exec pod install     # relinks the optional #include
yarn example ios
```

`local.xcconfig` is gitignored and every setting it feeds is referenced from
tracked files, so `git status` stays clean and build B cannot ship by accident.
Confirm `[SPIKE] build B: startDiscoveryAfterFirstTapOnCastButton=false` in the
console — its absence means the xcconfig was not picked up and **the rows below
are measuring build A**.

| #     | Row                                                                   | Status | Evidence |
| ----- | --------------------------------------------------------------------- | ------ | -------- |
| 1.3.1 | `[SPIKE] build B:` line present at launch                             |        |          |
| 1.3.2 | `DiscoveryManager.isRunning()` true immediately after init (no tap)   |        |          |
| 1.3.3 | Custom-picker path: an explicit `startDiscovery()` populates the list |        |          |
| 1.3.4 | `rm example/ios/local.xcconfig && pod install` restores build A       |        |          |

### S1.4 — steady state, both platforms

| #     | Row                                                                                                                                                                                                                                                                                                | Status | Evidence |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 1.4.1 | Chooser opens from the CastButton                                                                                                                                                                                                                                                                  |        |          |
| 1.4.2 | Chooser opens from `showCastDialog()` with **no** button mounted (long-press first)                                                                                                                                                                                                                |        |          |
| 1.4.3 | `showExpandedControls()` opens the controller dialog while connected                                                                                                                                                                                                                               |        |          |
| 1.4.4 | Overlay: first "Overlay" → `true`; dismiss; "Overlay" again → `false` (`once: true` persisted)                                                                                                                                                                                                     |        |          |
| 1.4.5 | "Overlay∞" (`once: false`) → `true`, and resets the persisted flag on both platforms so 1.4.4 is re-runnable inside one install                                                                                                                                                                    |        |          |
| 1.4.6 | Overlay with the CastButton unmounted (no anchor) → `false`                                                                                                                                                                                                                                        |        |          |
| 1.4.7 | `showPlayServicesErrorDialog(...)` behaves per platform                                                                                                                                                                                                                                            |        |          |
| 1.4.8 | "Probe error (#12)" → rejected with `code` (and `nativeCode` where the platform supplies one)                                                                                                                                                                                                      |        |          |
| 1.4.9 | **Spike 0.3, with a real stimulus.** Connect → Fast Refresh → then _force state changes_: reconnect at least once and compare event identity/generation. "No obvious duplicates while idle" proves nothing. There is deliberately no `dispose()` button — Fast Refresh **is** the documented path. |        |          |

---

## S2 — probes → rows → cleanup

**Prerequisite: T1 (custom receiver) must be live before 2.2.7–2.2.9.** See
`cast-receiver/README.md`. Two manual steps remain: host `receiver.html` over
HTTPS, and register the app id + the Chromecast serial in the Cast Developer
Console.

Open the app's **"▸ Probes (device pass)"** section. It is collapsed by default
so tier-1 Maestro's visible surface is unchanged; expanding it is a manual step.

### S2.2 — run the rows

| #      | Row                                                                                                                                                                                                                                                                                                                                                                         | Status | Evidence |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 2.2.1  | **G3** `loadMedia` with the primary fixture → plays on the TV; `useMediaStatus` reports a `streamDuration` matching `expectedDuration`                                                                                                                                                                                                                                      |        |          |
| 2.2.2  | play / pause / seek +30 / seek 0 each resolve and are visible on the TV                                                                                                                                                                                                                                                                                                     |        |          |
| 2.2.3  | `setStreamVolume` / `setStreamMuted` round-trip into `useMediaStatus`                                                                                                                                                                                                                                                                                                       |        |          |
| 2.2.4  | **G4a** `stop()` → media status goes null in the UI **and** `useMediaStatus` (`mediaStatus is NULL`), while `Session:` still shows a live id — this is the premise `v5-82w` asserts in the reducer                                                                                                                                                                          |        |          |
| 2.2.5  | `queueLoad ×3` → three items; `queueJumpToItem` / `queueNext` / `queuePrev` / repeat-mode behave                                                                                                                                                                                                                                                                            |        |          |
| 2.2.6  | **G4b** Remove-last-queue-item → media status goes null, session stays alive                                                                                                                                                                                                                                                                                                |        |          |
| 2.2.7  | **G5** "Run flush race" → `pending confirmed`, then exactly one settlement, rejected `interrupted`, within 5 s of teardown. A line reading `INVALID` means the request settled before the teardown raced it — **re-run, do not tick**. Known limit: this proves the JS façade settles once, not that native fired one callback (that is `TrackedCastRequestTest.kt`'s job). |        |          |
| 2.2.8  | **G7** Channel registers: panel shows `channel=registered` with a status                                                                                                                                                                                                                                                                                                    |        |          |
| 2.2.9  | **G7, the load-bearing half (#614)** A `{"type":"hello"}` line appears in the event log **with no send** — the receiver posts it on `SENDER_CONNECTED`, while `addChannel` is still in flight. The default Media Receiver structurally cannot produce this row.                                                                                                             |        |          |
| 2.2.10 | Channel echo: "Send ping" → `channel → ping sent` then `channel ← {"type":"echo",…}`                                                                                                                                                                                                                                                                                        |        |          |
| 2.2.11 | End the session → the channel handle goes stale; `sendMessage` rejects `noSession`                                                                                                                                                                                                                                                                                          |        |          |
| 2.2.12 | Raw hooks readout shows plausible shapes for every hook against real GCK (this is what T2's boundary exists to survive)                                                                                                                                                                                                                                                     |        |          |
| 2.2.13 | _May defer_ — `resumeFailed`: kill the app mid-session, relaunch with the receiver unreachable                                                                                                                                                                                                                                                                              |        |          |

### S2.3 — Android notifications (6.2), with a stated matrix

Run **each** row on at least one Android 13-or-below device and one **Android
14+** device. Android 14+ is a required row (G6), not a smoke test.

**Verified statically before the pass — read this before blaming the wrapper.**

The plan carried a warning that Android 14+ needs `FOREGROUND_SERVICE` +
`FOREGROUND_SERVICE_MEDIA_PLAYBACK` or the app crashes fatally at cast start.
**That does not apply to this SDK version**, and chasing it would have burned
device time on a non-issue:

- `play-services-cast-framework 22.0.0` contains **no `MediaNotificationService`**
  at all — CAF ≥ 21.3.0 posts cast notifications through `NotificationManager`,
  not a foreground service (21.3.0 release notes). The only service in the AAR
  is `ReconnectionService`.
- The AAR declares `FOREGROUND_SERVICE` itself and it merges transitively (it is
  in the example's merged manifest). `FOREGROUND_SERVICE_MEDIA_PLAYBACK` is
  **not** needed, and adding a service type annotation would reference a class
  that no longer exists.
- The v4 Android-14 FGS crashes (#447, #527) are CAF 21.4.x-era. v5's support
  floor is 21.3.0, practically 22.x (`ext.castFrameworkVersion` overrides).

**The real API 33+ concern is `POST_NOTIFICATIONS`**, and its failure mode is
silent, which makes it much easier to misdiagnose as "our notification code is
broken": neither the AAR nor the app declared it, and the example targets SDK
36, so on Android 13+ the notification is simply suppressed. The example
manifest now declares it; **the permission must still be granted at runtime** —
the example has no runtime-permission prompt, so grant it explicitly before
running these rows:

```bash
adb shell pm grant com.castexample android.permission.POST_NOTIFICATIONS
adb shell dumpsys notification_manager | grep -A2 castexample   # confirm
```

If a row fails, check the grant first. Whether the library should request this
itself (or just document it) is a Phase 7 docs decision — record what you find.

| #     | Row                                                                                         | ≤ A13 | A14+ | Evidence |
| ----- | ------------------------------------------------------------------------------------------- | ----- | ---- | -------- |
| 2.3.1 | **G6** Cast start on Android 14+ does not crash                                             | n/a   |      |          |
| 2.3.2 | Notification renders while casting                                                          |       |      |          |
| 2.3.3 | Lock-screen rendering                                                                       |       |      |          |
| 2.3.4 | Actions work: play/pause, skip prev/next, stop casting                                      |       |      |          |
| 2.3.5 | Action set changes with content: single item vs queue (>1) vs photo (`CastOptionsDefaults`) |       |      |          |
| 2.3.6 | Tapping the notification opens the expanded controller                                      |       |      |          |
| 2.3.7 | Artwork appears on the real widget                                                          |       |      |          |
| 2.3.8 | Theme override (`@style/NitroCastExpandedController`) applies                               |       |      |          |
| 2.3.9 | _May defer_ — exotic permutations (live streams, no-artwork, RTL)                           |       |      |          |

### S2.4 — cleanup, informed by what S2.2/S2.3 showed

Deliberately **after** the rows: collapsing the probes before they have run
would give every failed row two suspects.

- Collapse the per-panel `run` wrappers into one `probe(label, fn)` (T6).
- Split high-frequency streams out of `append()` into live text lines — `append()`
  re-renders per event against a ≥1 Hz `progressTicker` (T6).
- Split the debug rig from a clean example screen (T7) so Phase 7 inherits an
  artifact instead of opening with a rewrite; update the App.tsx header.

> **CRITICAL — regression requirement.** `.maestro/tier1-fake-session.yml`
> asserts on exact log text: `.*fake session started delivered=true.*` and
> `.*fake session ended delivered=true.*`, plus `Session: none`,
> `Session: fake-session-1`, `Cast state: connected`, `Devices: 1`. Any logging
> or layout change must preserve those strings **and their on-screen
> visibility**, or update the flow in the same commit.
> **Gate: `scripts/e2e-android.sh` green before the PR.**
>
> Two local gotchas, both hit while preparing this checklist:
>
> - **Port 8081 must be free.** The script's "no Metro server is needed" premise
>   holds only when Metro is _unreachable_ — RN then falls back to the bundled
>   JS. A Metro from **another worktree** answering on 8081 returns a 404 for
>   this app instead, which is a hard red-screen error, not a fallback. Check
>   with `lsof -i :8081` first.
> - **Maestro needs a clean `adb devices`.** A stale `offline` emulator entry
>   makes it report "0 devices connected" even with a healthy device attached,
>   and `--device` does not override it. Clear the dead entries first.

### S2.5 — tier-2 Maestro (T8), labelled honestly

A **manually primed smoke script**, not CI-grade coverage: it cannot establish
the Cast session or choose the target unaided. It covers the deterministic
steady-state rows only. LNA, cold-start, and chooser device-selection stay
manual — automating system dialogs and network-dependent pickers produces flaky
CI.

---

## S3 — real iPhone, two rows

After T4. External prerequisites, named honestly: an available development team,
provisioning capability, a compatible bundle id, and a successful device install
— not a 15-minute code task. `example/ios/local.xcconfig` carries
`DEVELOPMENT_TEAM` / `RNGC_BUNDLE_ID_PREFIX` / `CODE_SIGN_STYLE` so none of it
lands in the tracked `project.pbxproj`.

| #   | Row                                                                                     | Status | Evidence |
| --- | --------------------------------------------------------------------------------------- | ------ | -------- |
| 3.1 | Build A: first CastButton tap → LNA prompt → grant → devices populate (#627 acceptance) |        |          |
| 3.2 | Build B: the LNA prompt appears **at launch** rather than on first tap                  |        |          |

---

## Web (separate bead) — gates the tag, not this one

#629 and #632 shipped a ~1100-line web transport and a `<google-cast-launcher>`
CastButton that have never run in a browser — only jest against
`src/transport/__fakes__/fakeWebCastSdk.ts`, while `docs/getting-started/web.md`
already documents the setup.

The harness is `web-example/` (`yarn workspace web-example dev`). W1 and W2 were
verified in Chrome with **no Cast device on the network**; the rest need one.
See [`web-example/README.md`](../../web-example/README.md) for the detail.

| #   | Row                                                                               | Status | Evidence                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Harness builds and serves; the Cast Sender SDK loads                              | ✅     | `vite build` clean; `SDK: ready`; `cast.framework` + `chrome.cast.isAvailable` true; `useCastState` → real `noDevicesAvailable`; zero console errors/warnings on load                                                                                                |
| W2  | `<google-cast-launcher>` renders once the SDK is available                        | ✅¹    | element created, custom element defined, wrapper 32×32, `tintColor` → `--connected-color`/`--disconnected-color`. CAF sets `display:none` itself while no devices exist (our code sets `display:block`) — **not a bug**; re-confirm visibility with a device present |
| W3  | Clicking it opens Chrome's device picker; connecting starts a session             |        |                                                                                                                                                                                                                                                                      |
| W4  | `loadMedia` plays on the TV                                                       |        |                                                                                                                                                                                                                                                                      |
| W5  | Media status + `useCastState` stream into the UI                                  |        |                                                                                                                                                                                                                                                                      |
| W6  | Disconnect ends the session cleanly                                               |        |                                                                                                                                                                                                                                                                      |
| W7  | A non-Chromium browser degrades gracefully (`noDevicesAvailable`, `notSupported`) |        | manual — not reachable through Chrome automation                                                                                                                                                                                                                     |

¹ verified as far as is possible without a Chromecast on the network.

---

## Definition of done

`v5-8hq.6` closes when every **non-deferrable** row above is ✅ with recorded
evidence; deferrals appear only in the may-defer list, each with a written
reason; harness changes pass `yarn typescript`, `yarn test`,
`prettier --check`, `compileDebugKotlin`, the iOS `xcodebuild` gate, **and
`scripts/e2e-android.sh`**; the integration/retest pass runs; and it ships as one
squashed PR to `v5`.

Then `bd close v5-8hq.6` → `v5-8hq` → **`v5-hw6` (Phase 7) becomes ready**.

**The 5.0.0-beta tag additionally requires the web rows (G8/W1–W7).** Phase 7
being unblocked is not the same as the release being ready.

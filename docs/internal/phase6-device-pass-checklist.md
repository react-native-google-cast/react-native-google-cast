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

> **⚠️ The harness moved on 2026-08-04** (bead `v5-57x`): `example/` →
> `playground/`, Android application id `com.castexample` →
> `com.reactnative.googlecast.playground`, iOS bundle id
> `org.reactjs.native.example.CastExample` →
> `com.reactnative.googlecast.playground`, and the receiver from the Default
> Media Receiver (`CC1AD845`) to the project's own published custom receiver
> (`EA48D3FC`). The **instructions** below have been updated. The **run logs**
> have not — they quote the ids that were live when they were recorded, and
> rewriting evidence to match today's config would make it worthless. Read any
> `com.castexample` / `example/` in a dated run log as "the harness as it stood
> that day".
>
> Because the receiver changed, **G3 and G4 must be re-run**; their 08-02/08-03
> results are statements about the Default Media Receiver, not about this build.
>
> One-time migration hazard, if you had built before the rename: RN's autolinking
> caches the old application id in `playground/android/build/generated/autolinking/`
> and `app/build/generated/autolinking/`, and the generated
> `ReactNativeApplicationEntryPoint.java` then fails with
> `package com.castexample does not exist`. Neither `assembleDebug` nor deleting
> one of the two directories fixes it — delete **both**, or run
> `./gradlew clean`. A fresh checkout (CI) never sees this.

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
   banner in `playground/probeFixtures.ts`. Symptom is a `loadMedia` that RESOLVES
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

The probe is gated behind `CHANNEL_PROBE_ENABLED` in
`playground/probeFixtures.ts`, with the reason written down. It was `false` for
the rest of the 08-02/08-03 pass; **it is `true` as of 2026-08-04**, now that
T1's receiver is deployed and the app launches it (`EA48D3FC`). The flag is
coupled to the app id — point the app back at the Default Media Receiver and
this goes back to `false` in the same change, or the session dies again.

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

### G6 ✅ — Android notifications (2026-08-04)

Ran after `adb shell pm grant com.castexample android.permission.POST_NOTIFICATIONS`
(the example has no runtime prompt).

**The finding that matters, and it is consumer-facing:
`MediaInfo.metadata` is required or no notification is posted at all.**
Isolated with the same `loadMedia` call, same URL, same single-item queue, same
session:

| Payload                                           | Notification |
| ------------------------------------------------- | ------------ |
| `{contentUrl}`                                    | ✗ none       |
| `{contentUrl, contentType, streamType}`           | ✗ none       |
| `{contentUrl, contentType, streamType, metadata}` | ✓ posts      |

Media casts and plays identically in all three, so this fails silently and
reads as "notifications are broken". Now documented on `MediaInfo.metadata`.
The harness gained a **"Load LAN bare"** button so the pair stays runnable.

| Row                            | Result                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Notification posts             | ✅ `0\|com.castexample\|1\|castMediaNotification\|10243`                                                             |
| Renders correctly              | ✅ title "LAN test pattern" from metadata, "Casting to Office TV", pause + skip-next, dismiss, seek bar              |
| Actions come from our provider | ✅ skip-next present with a 3-item queue — `NitroNotificationActionsProvider`'s queue-aware set (Decision 4)         |
| Tap → expanded controller      | ✅ focus = `com.castexample/com.margelo.nitro.googlecast.NitroExpandedControllerActivity`, live progress 01:16/10:00 |
| Android 14+ FGS hazard         | ✅ **does not apply to GCK 22.0.0** — see below                                                                      |
| Artwork on the widget          | ⬜ deferred — LAN fixture carries no image                                                                           |
| Theme override                 | ⬜ deferred (may-defer list: "exotic notification permutations")                                                     |
| Lock screen                    | ⬜ deferred — renders in the same MediaSession surface, which is confirmed                                           |

**Prior learning corrected.** The note "targetSdk 34+ needs `FOREGROUND_SERVICE`

- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` or the app fatally crashes at cast start"
  does **not** apply to `play-services-cast-framework 22.0.0`: its AAR manifest
  declares only `ReconnectionService` and `FOREGROUND_SERVICE`, and the AAR
  contains **no `MediaNotificationService` class at all** — the notification is
  posted through `MediaNotificationManager` via `NotificationManager`, with no
  foreground service involved. Verified by unzipping the AAR and by dumping the
  built APK's manifest with `aapt2`. Cast start on targetSdk **36** never crashed.

Useful probe for next time: `adb shell dumpsys notification | grep -A30
com.castexample` shows GCK's `cast_media_notification` channel. The channel
existing proves GCK accepted the `NotificationOptions` and initialised its
notification path — so "channel present, nothing posted" points at the payload,
not at configuration. That is what led to the metadata finding.

---

## Run log — 2026-08-04, iOS Simulator (S1.2, build A)

**iPhone 17 / iOS 26.5 Simulator**, no signing, default `GCKCastOptions`, against
the same real Chromecast ("Office TV") and the same LAN fixture. This confirms
the Phase 3 precedent: a Simulator reaches a real Chromecast on the LAN, so only
the two LNA rows genuinely need a physical iPhone.

| Row                          | Evidence                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold-launch seed             | `init seed: castState=noDevicesAvailable playServices=success devices=0` → `castState → notConnected` → `devices → [Office TV]`                |
| **G2 discovery**             | ✅ real Chromecast appears — and as **one** entry. The Android duplicate (`v5-6l1`) does **not** reproduce on iOS, so that bug is Android-only |
| 1.4.2 `showCastDialog()`     | ✅ opens GCK's native "Cast to" sheet listing `Office TV / Default Media Receiver`                                                             |
| **G1 lifecycle, ordered**    | ✅ `showCastDialog → true`, `connecting`, `starting (—)`, `connected`, `started (<id>)` — same order as Android, twice                         |
| `ended` carries `nativeCode` | ✅ `ended: appNotFound / native 21`                                                                                                            |
| Reconnect generation         | ✅ second connect produced a **new** id (`ea3f9c82…` → `3e3c5e51…`), `gen=3`                                                                   |
| **G3 media load / play**     | ✅ `loadMedia(LAN) resolved`, then `pushes=19 live=true player=playing pos=98.823955 queue=1`                                                  |
| `storeDiagnostics`           | ✅ the same "Dump store" probe works unchanged on iOS                                                                                          |

### iOS G4 and G5 (same session, run in that order)

**G4 ✅ — identical to Android.** `stop resolved`, then
`player=idle pos=0 queue=0` with `live=true session=true gen=3` unchanged, and
the hooks readout showing `useMediaStatus: idle pos=0 items=0 idle=cancelled` /
`mediaStatus is set`. So the amended G4 criterion holds on **both** platforms,
and the v5-82w null-push path is exercised by neither — the Default Media
Receiver simply never reports a null `mediaStatus`.

**G5 ✅.**

```
24 · flush(tight): endCurrentSession accepted
25 · flush(tight): settle #1 rejected code=interrupted native=undefined after 64ms
26 · ending (3e3c5e51-99c0-461b-8227-2832e8983827)
27 · castState → notConnected
28 · ended
30 · flush(tight): settle count 3000ms after teardown = 1 (expect 1)
```

64 ms against Android's 65 ms, and settle count 1 three seconds after teardown.
Two cross-platform divergences worth knowing, neither a defect:

- **Flush timing within teardown.** On iOS the rejection lands _before_
  `ending`; on Android it lands _between_ `ending` and `ended`. Different
  implementations of `flushPendingRequests` running at slightly different points
  in the teardown — both settle exactly once with `interrupted`.
- **`ended` payload.** iOS reports a bare `ended` for a deliberate
  `endCurrentSession(false)`; Android reports `ended: failed / native 2161` for
  the same operation. Consumers should not read Android's error here as a
  failure of the disconnect.

**Observation, not a bug: two senders on one Default Media Receiver.** The first
iOS connect _joined_ the session the Android app already had (identical
`sessionId`), and that session then self-terminated with `appNotFound / native
21`. Force-stopping the Android app and reconnecting gave a clean new session
immediately. Worth remembering when a device pass drives both platforms at once
— it looks like an iOS defect and is not one.

**Tooling note that saves the next session an hour:** Maestro **does** drive the
iOS Simulator (`maestro test --platform ios <flow>`), even though it cannot see
the physically-attached Android phone on this machine. Two gotchas: the flow's
`appId` must be the **iOS bundle id**, which on 08-04 was
`org.reactjs.native.example.CastExample` and not the Android
`com.castexample` — the 08-04 rename made both platforms
`com.reactnative.googlecast.playground`, so this particular trap is now gone,
but check rather than assume. And `tapOn:` by text was unreliable against this RN tree —
`tapOn: { point: "27%,54%" }` worked every time. Read _values_ off
`xcrun simctl io <udid> screenshot`, not off the view hierarchy. AppleScript /
System Events is a dead end: it blocks on an accessibility-permission prompt.

### Still to run on Android

- ~~**S1.4 one-shots**~~ — done 2026-08-09, both platforms; see that run log.
- **S2.3 notifications** — needs
  `adb shell pm grant com.reactnative.googlecast.playground android.permission.POST_NOTIFICATIONS`
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

The owner reproduced the same media failure through the web harness (then
`web-example/`, now `yarn playground web`) in Chrome.
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

**Next decisive test:** load the same URL through the web harness (Chrome sender
SDK → same receiver). If it also fails, the receiver/asset is the problem; if it
plays, the fault is in the Android `loadMedia` path.

---

## Run log — 2026-08-06, Android — **G7 parity + G3/G4 on the custom receiver**

moto g05 / Android 15 (`ZY32KXN6T3`), `EA48D3FC`, session
`128f78a9-2fa9-4aea-bdba-ca49e4380725`, same `LAN_FIXTURE` and same Chromecast
as the 08-04 iOS run — so the two are directly comparable.

| Row                     | Status | Evidence                                                                               |
| ----------------------- | ------ | -------------------------------------------------------------------------------------- |
| **G7 handshake (#614)** | ✅     | `[8] channel ← {"type":"hello",…}` directly after `[7] started`, no send. Same as iOS. |
| G3 load / play          | ✅     | `[10] loadMedia(LAN) resolved`, `[11] façade getMediaStatus: playing pos=0.559`        |
| G4 `stop()`             | ✅     | `[13] stop resolved`, `[14] façade getMediaStatus: idle pos=0` — **same as iOS**       |
| Queue load + 3 × remove | ✅     | `[19] [22] [24]` all resolved, no crash                                                |
| G4b queue emptied       | ⚠️     | `[25] façade getMediaStatus: **idle** pos=0` — **iOS gave `null` here.** See below.    |

### ⚠️ Two cross-platform differences the oracle surfaced

Both are wire-level observations, i.e. things no unit test in this repo can see:
the golden corpus covers struct↔GCK, not the serialized cast-protocol JSON.

**1. ~~`duration` for an unset `streamDuration` — `null` on Android, `0` on
iOS.~~ FIXED 2026-08-06 (`v5-3mg`).** Identical `loadMedia` call, byte-compared
`LOAD` payloads:

```
Android  …,"metadata":{…},"duration":null,"mediaCategory":"VIDEO"}
iOS      …,"contentUrl":"…","duration":0,"mediaCategory":"VIDEO"}     ← before
iOS      …,"contentUrl":"…","duration":null,"mediaCategory":"VIDEO"}  ← after
```

Everything else already matched exactly — `contentId` defaulted from
`contentUrl`, `streamType":"BUFFERED"`, `contentType`, `metadata`, `autoplay`,
`playbackRate` — so this was the **only** divergence in what the two platforms
put on the wire for the same call, and `0` was the wrong one: for a BUFFERED
stream the receiver measures the real duration, so `null` means "unknown" while
`0` claims "zero-length". It caused no harm on this receiver, but a receiver
that trusts `duration` would have been misled by iOS.

Cause and fix: iOS left `GCKMediaInformationBuilder`'s default of 0 when
`streamDuration` was nil; it now writes `kGCKInvalidTimeInterval` explicitly.
**Verified on the wire, not inferred** — that `kGCKInvalidTimeInterval`
serializes as `null` rather than being coerced or omitted was an open question
until the oracle answered it, and playback still works (`playing pos=38.7`).
Both native suites re-run green (iOS 28/28, Android 10/10), and the Android
test's `streamDuration` platform branch is gone along with the class-level
`ANDROID DIVERGENCE` note — both fields it covered are now closed.

**2. After the queue is emptied: Android reports `idle`, iOS reports `null`.**
Same fixture, same receiver, same three `queueRemoveItems(last)` calls.

The wrapper is symmetric — both platforms push `status?.toMediaStatus()`
(`HybridCastTransport.kt:848`, `HybridCastTransport.swift:685`) — so neither
side is swallowing or inventing a null. The difference is in GCK itself: iOS's
`GCKRemoteMediaClient.mediaStatus` went nil, Android's `RemoteMediaClient`
returned a status object with `playerState: IDLE`.

⚠️ **Not a controlled comparison, and it must not be written up as one.** The
Android removals were not the same sequence: after the second removal CAF
auto-issued a `LOAD` for the next item (`[21]`, `test3.mp4`), which the iOS run
did not show. So "platform difference" is the leading explanation, not a
established one — the confound is real. To settle it, remove items in an
identical order on both and compare.

**Consumer takeaway either way, and it is already the documented guidance:**
treat "nothing is playing" as `status === null || playerState === 'idle'`, never
as `status === null` alone. `useMediaStatus`'s doc comment says this; this run is
the evidence for why it has to.

---

## Run log — 2026-08-04, iOS Simulator — **G3/G4 re-run on the custom receiver**

Session `34afb6e3-7c85-472b-bbb9-c3b4c8bf6e52`, `EA48D3FC`, `LAN_FIXTURE`
(`test.mp4` re-measured with `ffprobe` at **600.0 s**, `test2` 15.0 s, `test3`
20.0 s — the fixture file's `expectedDuration` values are correct). Line numbers
in brackets are event-log entries.

### G3 ✅ — load / play / pause / stop on the custom receiver

| Row   | Evidence                                                                               |
| ----- | -------------------------------------------------------------------------------------- |
| load  | `[12] media: loadMedia(LAN) resolved`                                                  |
| play  | `[14] façade getMediaStatus: playing pos=138.305844 vol=1` — real playback             |
| pause | `[16] media: pause resolved`, `[17] … paused pos=187.856472` (position advanced ~50 s) |
| stop  | `[19] media: stop resolved`                                                            |

### ⭐ G4 — **both halves now have real-hardware evidence, and they differ**

This is the row that had never been exercised. The two routes to "nothing is
playing" do **not** behave the same:

| Route                                | Result                                         |
| ------------------------------------ | ---------------------------------------------- |
| `stop()`                             | `[20] façade getMediaStatus: idle pos=0 vol=1` |
| queue emptied via `queueRemoveItems` | `[35] façade getMediaStatus: **null**`         |

**So G4's amended criterion holds, and G4b's original one is verified as
written.** The amendment on 08-03 said "the DMR reports `idle`, never null" —
that turns out to be a statement about `stop()`, not about the receiver: the
**custom** receiver reports `idle` for `stop()` too, so it is CAF behaviour, not
a Default-Media-Receiver quirk. Emptying the queue is a different matter, and it
**is the first real-hardware exercise of the `v5-82w` / #626 null-clear path** —
`useMediaStatus` genuinely goes null, and the session stays alive throughout
(`castState: connected`, same session id, before and after).

Queue rows also passed on the way: `queueLoad` (3 LAN items), and three
`queueRemoveItems(last)` calls, `[29] [31] [33]` all resolved with no crash —
the iOS side of the `v5-kbd` P0 shape, which cannot occur here because
`GCKMediaQueueItem.mediaInformation` is nonnull.

### 🔭 What the media oracle saw — first assertions on the actual wire payload

The oracle (T1, `receiver.html` Job 3) relayed every media-namespace command
back over the custom namespace. This is the first time a device row has checked
what was **sent** rather than inferring it from what the TV did.

1. **Both `61aecc6` fixes confirmed on the wire**, not just in unit tests. The
   `LOAD` request carries
   `"contentId":"http://192.168.1.40:8000/test.mp4"` — defaulted from
   `contentUrl`, which was never set explicitly — and
   `"streamType":"BUFFERED"`, also defaulted. These are exactly the two
   converter bugs the 08-02 v4 side-by-side caught by hand; they would now show
   up in the event log on the first load.
2. **`queueLoad` is sent as a `LOAD` carrying `queueData`, not as
   `QUEUE_LOAD`.** Worth knowing before writing an assertion against a message
   type: `[25]` reads `"message":"LOAD"` with a nested
   `"queueData":{"repeatMode":"REPEAT_OFF","shuffle":false,"items":[…]}`.
3. **`QUEUE_REMOVE` carries `itemIds`**, one per call: `[3]`, `[4]`, `[2]` for
   the three removals — so "remove last" really is removing the tail, and the
   `MediaStatus.queueItems` window shifted `[2,3]` → `[2,4]` → empty exactly as
   the windowing note on `MediaStatus.queueItems` describes.
4. ~~⚠️ **Open question — iOS sends `"duration":0` for an unset
   `streamDuration`.**~~ **Confirmed as a real difference on 2026-08-06 and
   fixed** (`v5-3mg`): Android sent `"duration":null`, iOS `"duration":0`, on
   otherwise byte-identical payloads. iOS now writes `kGCKInvalidTimeInterval`
   instead of leaving the builder's default of 0. This is the oracle finding a
   bug that no test in the repo could have: the golden corpus covers
   struct↔GCK, not the serialized cast-protocol JSON.

---

## Run log — 2026-08-04, iOS Simulator — **G7 ✅ PASSED**

**Cause of the block below: the Receiver Application URL had not been saved in
the Cast Developer Console.** Once it was saved and the Chromecast restarted,
every G7 row passed on the first attempt. The investigation is kept in full
because localising it took three eliminations, and the same failure will look
identical next time.

### G7 — CastChannel rows against the custom receiver (bead `v5-8hq.6`, #614)

Session `b258587a-5e77-405a-b4ed-f789716084cb`, event-log line numbers in
brackets. **Ordering is load-bearing:** the probes panel must be expanded
_before_ connecting — `useCastChannel` can only call `addChannel` once a session
exists, and the receiver sends `hello` exactly once, on `SENDER_CONNECTED`.

| Row                               | Status | Evidence                                                                                                                                                                                                                                                 |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Channel registers                 | ✅     | `channel=registered status=connected=true writable=true` on `urn:x-cast:com.reactnative.googlecast.probe`                                                                                                                                                |
| **Registration handshake (#614)** | ✅     | `[8] channel ← {"type":"hello","note":"sent on SENDER_CONNECTED, before the sender finished addChannel",…}` — immediately after `[7] started`, **with no send having occurred**. This is the row the Default Media Receiver structurally cannot produce. |
| Echo round trip                   | ✅     | `[10] channel → ping sent` → `[11] channel ← {"type":"echo","received":{"type":"ping","at":1785868656210},"at":1785868656400}` — 190 ms, payload echoed intact                                                                                           |
| Session-scoped teardown           | ✅     | `[12] ending` → `[14] ended`; panel flips to `channel=null status=null`, and a subsequent tap logs `channel: send SKIPPED — no channel`                                                                                                                  |

⚠️ **The teardown row's original wording was wrong** and has been corrected. It
said "the channel handle goes stale and `sendMessage` rejects `noSession`". That
is unreachable through this harness, and by design: `useCastChannel` nulls the
handle when the session ends, so a send after teardown never reaches the
transport at all. That is the better behaviour — there is no stale handle to
misuse — and the `noSession` rejection stays a unit-test concern
(`src/api/__tests__/channels.test.ts`). A device row cannot test it.

Confirmed in passing, same session: `1.2.1` cold-launch seed; `1.2.3` chooser →
connect → ordered `starting`/`connected`/`started`; `1.4.3` controller dialog
while connected (GCK's "Office TV / No media selected / volume / Stop casting"
sheet); and `client ready` in the media panel, i.e. `RemoteMediaClient` is
available against the custom receiver.

---

### The block, and how it was localised (kept for the next occurrence)

**Symptom: the Chromecast would not launch `EA48D3FC`.**
`startSession` reported `startFailed: cancelled / native 5`
(`GCKErrorCodeCancelled`) every time, ~2 s after `starting (—)`.

Setup: iPhone 17 Pro Simulator (iOS 26.5), commit `bd51f21` + the App.tsx panel
note. Receiver **"Office TV"**, `192.168.1.137`, firmware `1.56.291998`, SSID
`Zyxel_BB21`, same /24 as the Mac. Driven with `maestro test --platform ios`.

Confirmed working on the way (all Simulator-observable, as
`phase3-native-spike-checklist.md` predicted):

| Row                             | Evidence                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Discovery on the Simulator      | `devices → [Office TV]`, `castState → notConnected`, `Devices: 1`                                |
| GCK's own LNA explainer         | Shown on first CastButton tap; **not** the OS prompt (Simulators never present that — Apple)     |
| 1.2.2 discovery gated until tap | `devices=0` at init, populates only after the first CastButton tap — GCK's own logic, not the OS |
| Chooser                         | GCK "Cast to" sheet lists Office TV                                                              |
| **Connect against `CC1AD845`**  | ✅ `starting (—)` → `connected` → `started (61765b24-2f4b-427d-830d-8584749779c0)`, first try    |
| **Connect against `EA48D3FC`**  | 🔴 `starting (—)` → `startFailed: cancelled / native 5`, 3 attempts                              |

### What has been ruled out

The DMR row above is the controlled comparison: **same simulator, same network,
same Chromecast, same code path, same taps — only the app id differs.** So it is
not the Simulator, the network, the transport, or the session code.

1. **The receiver page is not broken.** Loaded
   `https://…github.io/react-native-google-cast/cast-receiver/` in Chrome: HTTP
   200, no `TypeError`, `cast.framework.messages.MessageType` resolves,
   no `skipping unknown MessageType` lines, and the page logs
   `receiver started, namespace urn:x-cast:com.reactnative.googlecast.probe` —
   so `context.start()` returned. The media-oracle interceptors registered
   cleanly. (This was the first suspect, since the oracle was the last change to
   the receiver.)
2. **The device was not busy.** `GET /setup/eureka_info` reported no running app.
3. **It is not a stale receiver-URL cache on the device.** Rebooted Office TV via
   `POST https://192.168.1.137:8443/setup/reboot` (confirmed: uptime went
   55 000 s → 31 s) and retried. **Identical failure.** So the remedy this
   repo's own receiver README recommends for a URL change does not apply here.

### ✅ Cause: the Receiver Application URL was never saved in the console

Everything above eliminated the sender, the network, the device state and the
receiver page, which left exactly one variable: the Cast Developer Console entry
for `EA48D3FC`. It was that — the URL edit had not been saved. Saving it and
restarting the Chromecast fixed it outright.

**So the diagnostic signature is worth remembering: an unreachable or unset
Receiver Application URL surfaces on the sender as `cancelled` / `native 5`, not
as `appNotFound` / `21`.** Nothing in the error names the receiver URL, and the
device is still discovered and listed while the discovery criteria carry the app
id — the id is registered, so discovery is satisfied; only the launch fails. If
a custom receiver ever stops launching again, check the console URL **first**,
before suspecting the sender.

Two corrections this forces on our own docs:

- `docs/internal/cast-receiver/README.md` says that if a Chromecast still loads
  the old receiver after a URL change, waiting and rebooting is the remedy. That
  is true for a _propagation delay_ but reads as the general fix, and here the
  reboot proved nothing — it eliminated a hypothesis rather than solving
  anything. The URL being **saved** is the thing to verify first.
- Nothing in the harness surfaces which receiver actually launched. Worth
  considering for tier-2: the receiver already reports over the custom namespace
  on `SENDER_CONNECTED`, so the `hello` message doubles as proof that _our_
  receiver — not some other build — is the one running.

---

## Run log — 2026-08-09 — **S1.4 one-shots (both platforms), S1.3 build B, spike 0.3**

Commit `74b9a15` + the harness changes in this change. Android: moto g05 / 15
(`ZY32KXN6T3`), driven over `adb`. iOS: **iPhone 17 Simulator / iOS 26.5**,
driven with `maestro test --platform ios`. Receiver `EA48D3FC` ("Office TV",
fw 1.56.291998). The Android app was force-stopped before the iOS run, so the
two-senders-join-one-session trap from 08-04 could not fire.

### S1.4 — the overlay one-shots, run in order from a virgin flag

Android's flag was verified virgin first (`shared_prefs/nitro_googlecast.xml`
did not exist), which matters: run out of order and every later row passes for
the wrong reason.

| #     | Android                                                                     | iOS                                                      |
| ----- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1.4.4 | ✅ `showIntroductoryOverlay → true`, dismiss, `→ false`                     | ✅ `[13] → true`, dismiss via "OK", `[14] → false`       |
| 1.4.5 | ⚠️ `overlay(once:false) → true` — but the flag is **not** reset. See below. | ⚠️ `[15] → true`, then `[16] → false`. Same outcome.     |
| 1.4.6 | ✅ no anchor → `overlay(once:false) → false`                                | ✅ `[17] overlay(once:false) → false`                    |
| 1.4.7 | ✅ `showPlayServicesErrorDialog → false` (`success` needs no dialog)        | ✅ `[18] → false` (documented Android-only, never shown) |
| 1.4.8 | ✅ `probe: rejected code=appNotFound native=undefined`                      | ✅ `[19]` identical                                      |
| 1.4.3 | ✅ `showExpandedControls → true`, focus = `NitroExpandedControllerActivity` | ✅ 08-04                                                 |

**1.4.6 has to be run with `once: false`.** With the once-flag already set, an
`{once: true}` call returns `false` whether or not an anchor exists — the row
would pass without ever reaching the no-anchor guard. `{once: false}` skips the
flag check (Android) / clears it (iOS), so a `false` can only come from the
anchor.

### ⚠️ Row 1.4.5's criterion is wrong on **both** platforms — amended

The row asked for `once: false` to "reset the persisted flag on both platforms
so 1.4.4 is re-runnable inside one install". Measured, it does not, and the
mechanisms differ while the observable outcome is identical:

| Platform | What `once: false` does                                                                   | Then `once: true`                                      |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Android  | Bypasses the `SharedPreferences` check; **never writes or clears it**. Dismiss re-sets it | `→ false` — flag still `true`                          |
| iOS      | `clearCastInstructionsShownFlag()`, then GCK **re-sets its own flag on presentation**     | `→ false` — `gck_castInstructionsShown` back to `true` |

Android's pref was read between every step: absent → (show) still absent →
(dismiss) `nitro_googlecast_intro_overlay_shown=true` → (once:false show +
dismiss) still `true`. iOS's `gck_castInstructionsShown = true` was read out of
the simulator's app container.

**Amended criterion:** `{once: false}` shows the overlay regardless of the
persisted flag; it does **not** make `{once: true}` show again. To re-run 1.4.4
inside one install, delete the flag — `adb shell run-as <id> rm
shared_prefs/nitro_googlecast.xml` (Android) or erase the app data (iOS). The
amendment is to the _criterion_, on device evidence, and both platforms agree —
so this is not a platform difference and must not be written up as one.

### 🎨 Android's introductory overlay renders unreadably — and v4 does too

Same call, same session, side by side: **iOS** draws the full overlay (dimmed
scrim, highlight circle on the button, "Touch to cast media to your TV and
Speakers", an "OK" button). **Android** draws a near-white scrim with no legible
title and no dismiss affordance — it is dismissible (tap anywhere, and the
dismiss listener fires, so the promise and flag behave correctly), but a user
would not know what it is.

Cause is a missing style, not a v5 bug: `IntroductoryOverlay.Builder` is used
with no `setTitleText()` / `setOverlayColor()`, and neither the library
(`android/src/main/res/values/styles.xml` defines only
`NitroCastExpandedController`) nor the playground theme supplies the Cast intro
attributes. **v4 does exactly the same** (`RNGCCastContext.java:160`), so this is
inherited behaviour at parity, not a regression. Phase 7 docs decision: either
document that consumers must theme the overlay, or give the builder a default
title. Screenshots of both platforms are in the session scratchpad.

### S1.3 — iOS build B, and the mechanism that also carries S3's signing

| #     | Status | Evidence                                                                                                                        |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1.3.1 | ✅     | `[SPIKE] build B: startDiscoveryAfterFirstTapOnCastButton=false` at launch — so the rows below are build B, not build A         |
| 1.3.2 | ✅     | Probes pane opened with **no CastButton tap**: `isRunning=true passive=false devices=1`; `devices → [Office TV]` before any tap |
| 1.3.3 | ✅     | CastButton unmounted, `stopDiscovery` → `isRunning=false`, then `startDiscovery` → `devices → [Office TV]` and `isRunning=true` |
| 1.3.4 | ✅     | `rm local.xcconfig` + `pod install` + rebuild → **no** `build B:` line in the launch log (1298 process log lines in the window) |

`local.xcconfig` never appeared in `git status`, which is the point of the
mechanism. Two documented cycle-eaters both fired exactly as written: each
`pod install` rewrote the `hermes-engine` line under `SPEC CHECKSUMS` (reverted,
not committed), and re-pointing `Pods/Manifest.lock` at the committed lock
avoided the "sandbox is not in sync" false alarm.

### ⭐ The iOS first-tap gate is **per installation, not per launch** — and the first explanation for it was wrong

Build A, rebuilt after removing the xcconfig, discovered `Office TV` at launch
with no tap, apparently contradicting 1.2.2. The app container had:

```
$ plutil -p "<container>/Library/Preferences/com.reactnative.googlecast.playground.plist"
  "gck_castInstructionsShown" => true
  "kGCKDiscoveryEverStarted" => true
```

A suggestively-named flag next to the symptom is not the cause, and this doc's
own rule about uncontrolled comparisons applies. Tested, in this order:

| Run                                                        | Result                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Build A, install that had run build B                      | discovers at launch, no tap — `devices → [Office TV]`        |
| Same, after terminating and **deleting the prefs plist**   | **still discovers at launch**; no GCK keys written back      |
| Same binary, after `simctl uninstall` + `install` + launch | ✅ gate holds — `Devices: 0`, `noDevicesAvailable`, for 30 s |

So the first explanation is **refuted**: `kGCKDiscoveryEverStarted` is a symptom,
not the switch — whatever GCK actually keys off survives deleting
`Library/Preferences/<bundle>.plist` and lives elsewhere in the container. What
_is_ established is the behaviour: the gate is one-time per **installation**, so
**1.2.2 is only measurable on a fresh install**, and a build-A/build-B
comparison must run A first or reinstall in between. That is what
`DiscoveryManager`'s doc now says — deliberately without naming a mechanism.

(This does not put 1.2.2's existing ✅ in doubt: a run where the list _stayed_
empty is itself evidence the install had not yet discovered.)

### `DiscoveryManager.isRunning()` is a tick behind start/stopDiscovery

`[7] after startDiscovery isRunning=false` then `[10] read isRunning=true`, with
`devices → [Office TV]` in between: the transport hops to the main thread before
touching GCK, so the cached flag refreshes a tick later and a same-tick read
returns the pre-call value. Not a defect, but it reads as one. Documented on
`isRunning()`.

### 1.4.9 / spike 0.3 — two stimuli, and only one of them is the documented path

Both runs used a real stimulus (connect → Fast Refresh → forced end + reconnect),
and the refresh was confirmed to have landed rather than assumed.

**A. Editing `playground/App.tsx` — the documented developer path. ✅ clean.**
Baseline (pre-refresh) and post-refresh reconnects produced **exactly one event
per transition**: `ending` ×1, `ended` ×1, `startSession accepted` ×1,
`connecting` ×1, `starting` ×1, `connected` ×1, `started` ×1, with a new id
(`9a9b5c11…` → `2b7e30a7…`). No duplicates, no leaked listeners.

**B. Editing a library module (`src/state/CastStore.ts`) — not a consumer path.**
The session-lifecycle stream goes silent for the rest of the process: a full
end + reconnect logged `castState → notConnected` / `endCurrentSession accepted`
/ `startSession accepted` / `connecting` / `connected` and **no** `ending`,
`ended`, `starting` or `started` at all, while cast-state events kept flowing.
The store was fine throughout (`session=true sid=4dd716aa… gen=3`), and the
Media panel still read `client ready`. So this is a **dropped subscription after
module re-evaluation**, not a leak and not native — worth a bead, but it needs a
library-source edit to reproduce, so no consumer can hit it.

### ⭐ `v5-3ll` — the visible signature was the harness. The snapshot claim is untested.

The signature (`castState=connected` beside `Session: none` after a Fast
Refresh) reproduced immediately. A "Dump store" taken at that same moment says:

```
store: pushes=10 live=true session=true sid=4dd716aa-… gen=1 castState=connected
```

The store **had** the session. What did not was `App.tsx`, whose `sessionId`
state started at `null` and was fed only by session-lifecycle events — events
that had already fired before the component remounted. A display driven purely
by events cannot show state that predates it. The doc's standing suspect
(`toSessionInfo()` returning null because `castDevice == null`) is not what this
run shows.

Fixed in the harness by seeding from `sessionManager.getCurrentCastSession()`.
Re-tested: connect → Fast Refresh now renders `Cast state: connected` **and**
`Session: ac786b75-…`.

⚠️ **Scope, so the bead is not closed on this.** The dump was taken _after_ the
refresh, and `pushes` moved 7 → 10 across it — so "the native `InitialSnapshot`
carried a null session and a later push repaired it" is still consistent with
everything above. What is established is that the **visible signature** was a
harness artifact; whether the snapshot itself ever disagrees with `castState`
was not measured and needs the native-side log the bead already proposes.

### `startSession(deviceId)` rejecting `appNotFound` — the 08-02 open item

It works on this build (`startSession(Office TV) accepted` → `started`,
repeatedly). It rejects `appNotFound` in one specific state: after
`castState → noDevicesAvailable`, i.e. GCK's live route list has emptied while
our cached `devices` array still shows the device (no `devices → []` was
emitted), so the green device button is still on screen and native cannot
resolve the id. Reproduced twice. That is a stale-cache disagreement worth its
own bead, not a broken API.

### 🔧 Harness fixes this session (all four were blocking a row)

1. **The long-press that unmounts the CastButton was on the button.** On Android
   the native `MediaRouteButton` consumes the touch (its own tooltip wins), so
   `onLongPress` never fired and rows 1.1.6 / 1.4.6 were undrivable. Moved to
   the title.
2. **`styles.buttons` had no `flexWrap`.** On a 720px phone "PlayServices
   dialog" ran off the right edge and could not be tapped at all — row 1.4.7 was
   unreachable by layout accident.
3. **A Discovery panel** (`isRunning` / `startDiscovery` / `stopDiscovery`),
   first in the probes pane so it is legible in a screenshot without scrolling.
   It is the only observability for S1.3, and those are iOS-only APIs that had
   never executed on a device. The Android/web reading is labelled in the UI so
   a constant `false` is never mistaken for a measurement.
4. **`sessionId` seeded** — see the `v5-3ll` entry above.

### 🛠 Tooling: Maestro **can** drive the physical Android phone on this machine

The standing note — "Maestro reports 0 devices connected for a physically
attached phone" — was wrong about the cause. An unrelated local service
listening on TCP **5555** made `adb` register a phantom `emulator-5554 offline`,
and Maestro refuses to pick a device while a dead entry is listed. `adb
disconnect` and a server restart do not clear it, because the port really is
answering. Clipping the emulator port scan below it does:

```bash
adb kill-server && ADB_LOCAL_TRANSPORT_MAX_PORT=5554 adb start-server
```

Maestro also needs `JAVA_HOME` (it reports "Unable to locate a Java Runtime"
otherwise, which looks nothing like a device problem).

**Consequence: `scripts/e2e-android.sh` ran locally, on the phone, and is
green** — all seven tier-1 assertions pass with this change's layout edits
(wrapped button rows, restructured header, extra panel, seeded session line).
That gate no longer has to be taken on CI's word alone.

---

## Evidence header — fill in before S1.1

| Field                                   | Value                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Commit SHA under test                   |                                                                        |
| Date                                    |                                                                        |
| iOS GCK SDK                             | `google-cast-sdk 4.8.4` (Podfile.lock) — confirm unchanged             |
| Android GCK SDK                         | `play-services-cast-framework 22.0.0` — confirm unchanged              |
| Android device + OS                     |                                                                        |
| iPhone + iOS (S3 only)                  |                                                                        |
| Simulator + iOS (S1.2/1.3)              |                                                                        |
| Chromecast model                        |                                                                        |
| Chromecast firmware                     |                                                                        |
| Network (SSID, band, AP isolation off?) |                                                                        |
| Media fixture used                      | see `playground/probeFixtures.ts` — record which one, and any fallback |
| Custom receiver app id                  | T1; `—` until registered                                               |
| Raw logs                                | path/gist of `adb logcat \| grep SPIKE` and the iOS console            |

---

## The gate

### Non-deferrable — each backs a documented public API

| #   | Row                                                         | Where                                  | Android                                                             | iOS                                                            |
| --- | ----------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| G1  | Session lifecycle, ordered, both platforms                  | S1.1, S1.2                             | ✅ 08-02                                                            | ✅ 08-04 Simulator                                             |
| G2  | Discovery — real device appears in the list                 | S1.1, S1.2                             | ✅ 08-02                                                            | ✅ 08-04 Simulator (single entry)                              |
| G3  | Media load / play / stop                                    | S2.2                                   | ✅ 08-06 re-run on EA48D3FC                                         | ✅ 08-04 Simulator, re-run on EA48D3FC                         |
| G4  | #626 clear-on-stop **and** clear-on-empty-queue (see note)  | S2.2                                   | ✅ 08-06 on EA48D3FC — `stop()`→`idle`, empty queue→`idle`          | ✅ 08-04 on EA48D3FC — `stop()`→`idle`, **empty queue→`null`** |
| G5  | #624 request interruption (flush race)                      | S2.2                                   | ✅ 08-03 `interrupted` @65 ms, settle count 1                       | ✅ 08-04 @64 ms, settle count 1                                |
| G6  | Android notifications, **incl. Android 14+**                | S2.3                                   | ✅ 08-04 on targetSdk 36 (artwork/theme/lock-screen deferred)       | n/a                                                            |
| G7  | CastChannel registration-time handshake                     | S2.2                                   | ✅ 08-06 handshake confirmed                                        | ✅ 08-04 Simulator, all 4 rows                                 |
| G8  | Web smoke — launcher → connect → load → status → disconnect | Web (gates the **tag**, not this bead) | ✅ 08-07 Chrome (W1–W6); W7 ✅ 08-09 Safari — whole web table green |                                                                |

> **G4 — the criterion was amended on 08-03, and 08-04 shows the amendment was
> only half right.** The row originally asked for `useMediaStatus` to go **null**
> after `stop()` and after removing the last queue item. The 08-03 amendment
> generalised from `stop()` to both, concluding "this receiver never produces a
> null `mediaStatus`". The 08-04 re-run on the custom receiver splits them:
>
> - **`stop()` → `idle`, never null.** Confirmed on _both_ receivers, so it is
>   CAF behaviour rather than a Default-Media-Receiver quirk. `null` means "no
>   session, or nothing ever loaded"; `idle` means "loaded, now stopped". The
>   amended criterion — the cached status is cleared of the finished media and
>   the session stays alive — is the right one here, and it passes.
> - **Queue emptied → genuinely `null`.** `[35] façade getMediaStatus: null`
>   after three `queueRemoveItems(last)` calls, session still alive. So the
>   v5-82w null-push path **is** reachable on real hardware, and G4b's original
>   wording was correct as written.
>
> ⚠️ Not yet established _why_ 08-03 saw `idle` here: that run removed the last
> item from a queue, today's emptied the queue completely (three removals). It
> could be receiver behaviour, or it could be "queue emptied" vs "one item
> removed" — those were not varied independently. Do not state it as a receiver
> difference without testing that.
>
> Consumer guidance is on `useMediaStatus`'s doc comment. Amending a gate row is
> exactly what the "no exceptions granted by the person who wants through the
> gate" rule is about, so both the amendment and this correction to it are
> recorded rather than quietly ticked: the change is to the _criterion_, on
> receiver evidence, not to the _standard_.

### May defer, with a written reason recorded in the row

`resumeFailed` · exotic notification permutations · the scan-stop row if
discovery observability is not added · reconnect-generation edge cases.

---

## S1 — no signing, no harness changes

Runs against `playground/App.tsx` with the **probes section collapsed** — i.e. the
app exactly as tier-1 Maestro sees it.

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
yarn playground start                    # Metro, own terminal
adb uninstall com.reactnative.googlecast.playground && yarn playground android
adb logcat | grep SPIKE
```

### S1.1 — Android, virgin install (**run first — perishable**)

| #     | Row                                                                                                                                                                                                                                                                                                                                                                                    | Status      | Evidence                                                                                                                                                                                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 | Cold launch: `init seed:` line shows `castState`, `playServices`, `devices=N`                                                                                                                                                                                                                                                                                                          |             |                                                                                                                                                                                                                                                                                                                   |
| 1.1.2 | CastButton mount triggers ACTIVE scan; the real Chromecast appears in the device list                                                                                                                                                                                                                                                                                                  |             |                                                                                                                                                                                                                                                                                                                   |
| 1.1.3 | **Phase 3 finding #2**: `readDevices()` / `CastDevice.getFromBundle(route.extras)` populates on real hardware (the emulator showed `devices=0` while `castState` reached `notConnected`)                                                                                                                                                                                               |             |                                                                                                                                                                                                                                                                                                                   |
| 1.1.4 | Tap the device → ordered `starting → started`; `Session:` shows a real id                                                                                                                                                                                                                                                                                                              |             |                                                                                                                                                                                                                                                                                                                   |
| 1.1.5 | End session → ordered `ending → ended`; `ended` carries a numeric `nativeCode`                                                                                                                                                                                                                                                                                                         |             |                                                                                                                                                                                                                                                                                                                   |
| 1.1.6 | ⚠️ **Scan-stop.** Long-press the **title** unmounts the CastButton (App.tsx — it used to be a long-press on the button, which Android's native `MediaRouteButton` swallowed). A frozen device list looks identical whether the scan stopped or the UI went stale. **Do not tick this row without discovery-state observability.** Defer with a reason, or add the observability first. | ⬜ deferred | 08-09: with the button unmounted the list stayed at `Devices: 1` — exactly the ambiguity the row warns about. The Discovery panel added for S1.3 does **not** help here: `isRunning()` is iOS-only, and on Android the framework owns discovery with no public read. Deferred for want of an Android-side signal. |

### S1.2 — iOS Simulator, build A (default `GCKCastOptions`)

No signing. Per `phase3-native-spike-checklist.md:11-15` a full session lifecycle
against a real Chromecast already ran on the iPhone 17 Simulator — the Simulator
is not a blocker here. Only the LNA-prompt rows need real hardware (S3), because
Apple's simulators never present that prompt.

```bash
cd playground && bundle install && cd ios && bundle exec pod install
yarn playground ios
```

> `pod install` may rewrite the `hermes-engine` line under `SPEC CHECKSUMS` in
> `playground/ios/Podfile.lock`. That checksum is environment-dependent (it differs
> between CI and at least one dev machine) — **do not commit it**; revert that
> one line and keep the rest.
>
> Reverting it does, however, desync the lock from CocoaPods' own copy, and the
> next local build fails with **"The sandbox is not in sync with the
> Podfile.lock"** — which reads like a missing `pod install` and is not one.
> Re-point CocoaPods at the committed lock instead of re-running the install:
>
> ```bash
> cp playground/ios/Podfile.lock playground/ios/Pods/Manifest.lock
> ```
>
> `Pods/` is untracked, so this changes nothing in git.

| #     | Row                                                                                                                                                                          | Status | Evidence |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| 1.2.1 | Cold-launch seed line                                                                                                                                                        |        |          |
| 1.2.2 | Device list stays empty until the first CastButton tap — GCK's own `startDiscoveryAfterFirstTapOnCastButton` logic, **not** the OS permission, so it is Simulator-observable |        |          |
| 1.2.3 | Chooser → connect → ordered lifecycle                                                                                                                                        |        |          |
| 1.2.4 | Disconnect → reconnect produces a new session generation (id changes)                                                                                                        |        |          |

### S1.3 — iOS Simulator, build B

Build B is a **build configuration**, not a source edit:

```bash
cp playground/ios/local.xcconfig.example playground/ios/local.xcconfig
cd playground/ios && bundle exec pod install     # relinks the optional #include
yarn playground ios
```

`local.xcconfig` is gitignored and every setting it feeds is referenced from
tracked files, so `git status` stays clean and build B cannot ship by accident.
Confirm `[SPIKE] build B: startDiscoveryAfterFirstTapOnCastButton=false` in the
console — its absence means the xcconfig was not picked up and **the rows below
are measuring build A**.

| #     | Row                                                                   | Status   | Evidence                                                                                        |
| ----- | --------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| 1.3.1 | `[SPIKE] build B:` line present at launch                             | ✅ 08-09 | `[SPIKE] build B: startDiscoveryAfterFirstTapOnCastButton=false`                                |
| 1.3.2 | `DiscoveryManager.isRunning()` true immediately after init (no tap)   | ✅ 08-09 | `isRunning=true passive=false devices=1`, probes opened without touching the CastButton         |
| 1.3.3 | Custom-picker path: an explicit `startDiscovery()` populates the list | ✅ 08-09 | button unmounted; `stopDiscovery` → `false`, `startDiscovery` → `devices → [Office TV]`, `true` |
| 1.3.4 | `rm playground/ios/local.xcconfig && pod install` restores build A    | ✅ 08-09 | no `build B:` line at launch; `git status` clean throughout                                     |

See the 08-09 run log for two things this row taught: the first-tap gate is
persisted per installation (`kGCKDiscoveryEverStarted`), so 1.2.2 is only
measurable on a fresh install; and `isRunning()` is a tick behind
`start`/`stopDiscovery`.

### S1.4 — steady state, both platforms

| #     | Row                                                                                                                                                                                                                                                                                                | Status               | Evidence                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4.1 | Chooser opens from the CastButton                                                                                                                                                                                                                                                                  | ✅ A 08-02 / i 08-04 | GCK chooser lists "Office TV" on both                                                                                                                 |
| 1.4.2 | Chooser opens from `showCastDialog()` with **no** button mounted (long-press first)                                                                                                                                                                                                                | ✅ A 08-02 / i 08-04 | `showCastDialog → true`, sheet opens                                                                                                                  |
| 1.4.3 | `showExpandedControls()` opens the controller dialog while connected                                                                                                                                                                                                                               | ✅ A 08-09 / i 08-04 | Android: `→ true`, focus = `NitroExpandedControllerActivity`                                                                                          |
| 1.4.4 | Overlay: first "Overlay" → `true`; dismiss; "Overlay" again → `false` (`once: true` persisted)                                                                                                                                                                                                     | ✅ 08-09 both        | Android pref absent → (dismiss) `…_intro_overlay_shown=true` → `→ false`; iOS `[13] true` → `[14] false`                                              |
| 1.4.5 | ~~"Overlay∞" (`once: false`) → `true`, and resets the persisted flag~~ **Amended 08-09**: `→ true` regardless of the flag, but it does **not** make a later `{once: true}` show again — on either platform                                                                                         | ✅ amended, 08-09    | Android `[4] true` then `[5] false`, pref still `true`; iOS `[15] true` then `[16] false`, `gck_castInstructionsShown=true`                           |
| 1.4.6 | Overlay with the CastButton unmounted (no anchor) → `false` — **run it with `once: false`**, or the flag answers instead of the anchor                                                                                                                                                             | ✅ 08-09 both        | Android `overlay(once:false) → false`; iOS `[17] → false`                                                                                             |
| 1.4.7 | `showPlayServicesErrorDialog(...)` behaves per platform                                                                                                                                                                                                                                            | ✅ 08-09 both        | Android `→ false` (`success` needs no dialog); iOS `→ false` (no counterpart). The dialog-shown path needs broken Play Services — deferred, see below |
| 1.4.8 | "Probe error (#12)" → rejected with `code` (and `nativeCode` where the platform supplies one)                                                                                                                                                                                                      | ✅ 08-09 both        | `rejected code=appNotFound native=undefined` — the lookup fails before GCK, so no native code exists to carry                                         |
| 1.4.9 | **Spike 0.3, with a real stimulus.** Connect → Fast Refresh → then _force state changes_: reconnect at least once and compare event identity/generation. "No obvious duplicates while idle" proves nothing. There is deliberately no `dispose()` button — Fast Refresh **is** the documented path. | ✅ 08-09 (Android)   | App.tsx refresh + forced end/reconnect: exactly one event per transition, new id. Library-module refresh drops the session stream — see the run log   |

> **1.4.7 deferral, stated:** only the "no dialog needed" branch is reachable on
> healthy hardware. Exercising the branch that _shows_ a resolution dialog needs
> a device with Play Services missing/outdated/disabled, which this rig does not
> have. Deferred with that reason; the code path is `GoogleApiAvailability`'s
> own, and our wrapper returns its boolean unchanged.

---

## S2 — probes → rows → cleanup

**Prerequisite: T1 (custom receiver) must be live before 2.2.7–2.2.9.** See
`cast-receiver/README.md`. Two manual steps remain: host `receiver.html` over
HTTPS, and register the app id + the Chromecast serial in the Cast Developer
Console.

Open the app's **"▸ Probes (device pass)"** section. It is collapsed by default
so tier-1 Maestro's visible surface is unchanged; expanding it is a manual step.

### S2.2 — run the rows

| #      | Row                                                                                                                                                                                                                                                                                                                                                                         | Status       | Evidence                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| 2.2.1  | **G3** `loadMedia` with the primary fixture → plays on the TV; `useMediaStatus` reports a `streamDuration` matching `expectedDuration`                                                                                                                                                                                                                                      |              |                                                                       |
| 2.2.2  | play / pause / seek +30 / seek 0 each resolve and are visible on the TV                                                                                                                                                                                                                                                                                                     |              |                                                                       |
| 2.2.3  | `setStreamVolume` / `setStreamMuted` round-trip into `useMediaStatus`                                                                                                                                                                                                                                                                                                       |              |                                                                       |
| 2.2.4  | **G4a** `stop()` → media status goes null in the UI **and** `useMediaStatus` (`mediaStatus is NULL`), while `Session:` still shows a live id — this is the premise `v5-82w` asserts in the reducer                                                                                                                                                                          |              |                                                                       |
| 2.2.5  | `queueLoad ×3` → three items; `queueJumpToItem` / `queueNext` / `queuePrev` / repeat-mode behave                                                                                                                                                                                                                                                                            |              |                                                                       |
| 2.2.6  | **G4b** Remove-last-queue-item → media status goes null, session stays alive                                                                                                                                                                                                                                                                                                |              |                                                                       |
| 2.2.7  | **G5** "Run flush race" → `pending confirmed`, then exactly one settlement, rejected `interrupted`, within 5 s of teardown. A line reading `INVALID` means the request settled before the teardown raced it — **re-run, do not tick**. Known limit: this proves the JS façade settles once, not that native fired one callback (that is `TrackedCastRequestTest.kt`'s job). |              |                                                                       |
| 2.2.8  | **G7** Channel registers: panel shows `channel=registered` with a status                                                                                                                                                                                                                                                                                                    | ✅ iOS 08-04 | `channel=registered status=connected=true writable=true`              |
| 2.2.9  | **G7, the load-bearing half (#614)** A `{"type":"hello"}` line appears in the event log **with no send** — the receiver posts it on `SENDER_CONNECTED`, while `addChannel` is still in flight. The default Media Receiver structurally cannot produce this row.                                                                                                             | ✅ iOS 08-04 | log line `[8]`, directly after `[7] started`, no send made            |
| 2.2.10 | Channel echo: "Send ping" → `channel → ping sent` then `channel ← {"type":"echo",…}`                                                                                                                                                                                                                                                                                        | ✅ iOS 08-04 | `[10]`→`[11]`, 190 ms, payload echoed intact                          |
| 2.2.11 | End the session → the hook nulls the channel (`channel=null status=null`) and a later send is a no-op. **Not** "`sendMessage` rejects `noSession`" — that is unreachable by design, since there is no stale handle to send on; it stays a unit-test row.                                                                                                                    | ✅ iOS 08-04 | `[12] ending`→`[14] ended`, then `channel: send SKIPPED — no channel` |
| 2.2.12 | Raw hooks readout shows plausible shapes for every hook against real GCK (this is what T2's boundary exists to survive)                                                                                                                                                                                                                                                     |              |                                                                       |
| 2.2.13 | _May defer_ — `resumeFailed`: kill the app mid-session, relaunch with the receiver unreachable                                                                                                                                                                                                                                                                              |              |                                                                       |

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
broken": neither the AAR nor the app declared it, and the playground targets SDK
36, so on Android 13+ the notification is simply suppressed. The playground
manifest now declares it; **the permission must still be granted at runtime** —
the playground has no runtime-permission prompt, so grant it explicitly before
running these rows:

```bash
adb shell pm grant com.reactnative.googlecast.playground android.permission.POST_NOTIFICATIONS
adb shell dumpsys notification_manager | grep -A2 googlecast.playground   # confirm
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
— not a 15-minute code task. `playground/ios/local.xcconfig` carries
`DEVELOPMENT_TEAM` / `RNGC_BUNDLE_ID_PREFIX` / `CODE_SIGN_STYLE` so none of it
lands in the tracked `project.pbxproj`.

| #   | Row                                                                                     | Status   | Evidence                                                                                                                       |
| --- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 3.1 | Build A: first CastButton tap → LNA prompt → grant → devices populate (#627 acceptance) | ✅ 08-09 | no prompt at launch; `noDevicesAvailable`/0 until the tap; tap → GCK explainer → OK → **OS prompt** → Allow → `notConnected`/1 |
| 3.2 | Build B: the LNA prompt appears **at launch** rather than on first tap                  | ✅ 08-09 | prompt at launch with nothing touched → Allow → `notConnected`/1; GCK's explainer **never appeared**                           |

### Run log — 2026-08-09, iPhone 13 mini / iOS 26.5 (`00008110-0014…`), **S3 ✅**

Free personal team, bundle id `com.petrbela.playground`, receiver `EA48D3FC`,
Chromecast "Office TV". A controlled A/B: same binary, same phone, same
fresh-install state, only `local.xcconfig` differing.

| Moment                          | Build A                                     | Build B                      |
| ------------------------------- | ------------------------------------------- | ---------------------------- |
| At launch, nothing touched      | **no** OS prompt; `noDevicesAvailable`, 0   | **OS prompt**                |
| GCK's own LNA explainer overlay | shown, on the first Cast-button tap         | **never shown**              |
| OS prompt                       | after the explainer's OK                    | at launch, before any UI     |
| After granting                  | `notConnected`, `Devices: 1`, `[Office TV]` | `notConnected`, `Devices: 1` |

**The ordering is the part no Simulator could show:** GCK presents its own
rationale screen _first_, and the OS prompt follows it. They are two different
dialogs, and the 08-04 Simulator note ("GCK's own LNA explainer, **not** the OS
prompt") was right that only the first is Simulator-observable.

**⚠️ Consumer-facing consequence of build B, and it is a real trade-off:
turning `startDiscoveryAfterFirstTapOnCastButton` off loses GCK's explainer.**
The user's first experience of the app becomes a bare system permission dialog
before any UI has explained why. An app that opts into build B (typically to
drive a custom device picker) should show its own rationale first, or accept a
worse grant rate. Worth stating wherever build B is documented.

### 🔴 The trap that makes S3 unmeasurable in the usual build

**A Debug build cannot measure either row.** RN connects to Metro over the LAN at
launch, which triggers the local-network prompt before any Cast code runs — so
build A and build B look identical, and the first attempt here duly showed "the
prompt at launch" in a build A that was gating discovery correctly. Both rows
must be run with `--mode Release` (bundled JS, no packager). Recorded in
`local.xcconfig.example` too, since that is where the next person will be.

**Delete the app between rows.** The LNA grant _and_ GCK's discovery gate both
persist per installation (see the 08-09 S1.3 log), so reinstalling over the top
invalidates the next row. Deleting also drops the developer-profile trust, so
expect to re-trust in Settings ▸ General ▸ VPN & Device Management each time.

### Device-build traps, each of which cost a cycle

1. **`-allowProvisioningUpdates` is required and the RN CLI does not pass it** —
   without it: `No profiles for 'com.petrbela.playground' were found … Automatic
signing is disabled and unable to generate a profile`. Use
   `yarn playground ios --udid <id> --extra-params "-allowProvisioningUpdates"`.
2. **The phone must be unlocked**, or the build fails much earlier with `The
developer disk image could not be mounted on this device` — which reads like a
   Developer Mode or pairing fault and is neither. `xcrun devicectl list devices`
   shows `connected (no DDI)`; `devicectl device info lockState` shows
   `passcodeRequired: true`.
3. **First install of a signing identity needs a manual trust** before iOS will
   launch it (`invalid code signature, inadequate entitlements or its profile has
not been explicitly trusted`).

### Tooling reality on a physical iPhone

Unlike the Simulator and the Android phone, this device could not be driven from
the host: Maestro's `list-devices` shows simulators only (its iOS runner needs a
signed XCUITest host), `devicectl` has no tap or screenshot verb, and
`log stream --device-name` is gone in this macOS. **S3's taps are manual by
necessity** — build, install and launch are scripted; the four observations are
read off the phone. Plan for that rather than discovering it mid-run.

Also confirmed in passing, and it upgrades an existing row: **1.2.2's gate holds
on physical hardware, not just the Simulator** — build A sat at
`noDevicesAvailable` / `Devices: 0` until the first Cast-button tap.

---

## Web (separate bead) — gates the tag, not this one

#629 and #632 shipped a ~1100-line web transport and a `<google-cast-launcher>`
CastButton that have never run in a browser — only jest against
`src/transport/__fakes__/fakeWebCastSdk.ts`, while `docs/getting-started/web.md`
already documents the setup.

**The harness is now the playground itself** — `yarn playground web`, serving
`playground/index.html` + `index.web.tsx` through Vite alongside Metro
(bead `v5-5tx`, 2026-08-06). The separate `web-example/` package is gone. Same
`App.tsx` on all three platforms: what differs lives in the library's `.web.*`
files and a `Platform.OS` caveat banner, not in a second harness. Two rigs
existed to verify cross-platform parity, so letting them drift would have
undermined the thing they check.

W1 and W2 were verified in Chrome with **no Cast device on the network**, first
against `web-example/` and re-confirmed against the merged playground; the rest
need a device.

Re-confirmed after the merge (2026-08-06): the `.web.*` swap works —
`fakeSession.web.ts`, `CastButton.web.tsx` and `CastTransport.web.ts` are the
modules Vite actually serves — and two rows behave exactly as
`docs/getting-started/web.md` claims: `showExpandedControls → false`, and the
debug seam reports `fake session started delivered=false`.

> That `delivered=false` is deliberate and load-bearing. The tier-1 Maestro flow
> asserts on `fake session started delivered=true`, which is only meaningful
> because a `true` means the event crossed the native boundary twice. A web stub
> returning `true` would turn that assertion into decoration, so the web seam
> returns `false` — the same thing the native seam's contract already means by
> it: _the seam is inactive_.

**To finish W3–W6** put a Chromecast on this machine's network, reload, then:
the launcher becomes visible and `useCastState` moves to `notConnected`; click
it (or "Dialog") → Chrome's picker → choose the device; "Load LAN" plays;
play/pause/seek/volume/stop each land; "End session" gives `ending` → `ended`.

⚠️ **W3–W6 cannot be driven by browser automation.** Chrome's Cast picker is
browser-native UI, not page DOM, so the click that chooses a device has to be
made by hand. Plan for that rather than discovering it mid-run.

| #   | Row                                                                               | Status   | Evidence                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Harness builds and serves; the Cast Sender SDK loads                              | ✅       | `SDK: ready`; `cast.framework` + `chrome.cast.isAvailable` true; zero console errors on load. Re-confirmed 08-07 against the merged playground.                                                                         |
| W2  | `<google-cast-launcher>` renders once the SDK is available                        | ✅       | **Caveat resolved 08-07 with a device present**: launcher in the DOM, `display: block`, 28×28, `castState → NOT_CONNECTED`. The earlier `display:none` was CAF hiding it while no device existed — confirmed not a bug. |
| W3  | Clicking it opens the device picker; connecting starts a session                  | ✅       | 08-07: the **page-initiated** picker (in-page launcher, NOT Chrome's tab-mirroring menu) → `starting (—)` → `connecting` → `connected` → `started (89a076f8-e33a-4243-af9e-245cb470c801)`                               |
| W4  | `loadMedia` plays on the TV                                                       | ✅       | 08-07: `loadMedia(LAN) resolved`, `playing pos=0.55 dur=600 items=1` — `dur` is the receiver's own measurement and matches the fixture exactly                                                                          |
| W5  | Media status + `useCastState` stream into the UI                                  | ✅       | 08-07: `useMediaStatus` and `useStreamPosition` both stream (`useStreamPosition: 20.55`, advancing); `useCastState` / `useCastSession` / `useCastDevice: Office TV` all populate                                        |
| W6  | Disconnect ends the session cleanly                                               | ✅       | 08-07: `endCurrentSession accepted` → `ended` → `castState → notConnected`, `Session: none`                                                                                                                             |
| W7  | A non-Chromium browser degrades gracefully (`noDevicesAvailable`, `notSupported`) | ✅ 08-09 | Safari 26 / macOS: no launcher rendered, `Supported: false`, all four `show*` → `false`, mutations reject `notSupported`, nothing thrown. The `v5-7zm` DX defect is fixed — see the 08-09 Safari log below.             |

### Run log — 2026-08-07, Chrome (W1–W6 ✅ — **G8 closed**)

Merged playground (`yarn playground web`), receiver `EA48D3FC`, `LAN_FIXTURE`,
session `89a076f8-e33a-4243-af9e-245cb470c801`.

**⚠️ Use the page's own Cast button, never Chrome's ⋮ → Cast.** The browser menu
offers "Cast tab" / "Cast screen", which is Chrome's tab **mirroring** — a
different feature that never touches our transport, so casting that way would
produce a green-looking run that verified nothing. The row needs the picker the
page opens (`<google-cast-launcher>`, or our `showCastDialog()` →
`requestSession()`), which is what YouTube does.

The device-selection click inside that picker **cannot be automated** — it is
browser-native UI, not page DOM. Everything either side of it can be.

#### ⭐ Three-way wire comparison — the first time all three senders were diffed

The oracle relays the reserved media namespace back over our own, so the same
`loadMedia` call can now be compared as **actual bytes** across every platform:

| Field                                     | Android | iOS     | Web         |
| ----------------------------------------- | ------- | ------- | ----------- |
| `contentId` (defaulted from `contentUrl`) | ✅      | ✅      | ✅          |
| `contentUrl`                              | ✅      | ✅      | ✅          |
| `contentType`                             | ✅      | ✅      | ✅          |
| `streamType` (defaulted `BUFFERED`)       | ✅      | ✅      | ✅          |
| `metadata`                                | ✅      | ✅      | ✅          |
| `mediaCategory`                           | `VIDEO` | `VIDEO` | `VIDEO`     |
| `autoplay`                                | `true`  | `true`  | `true`      |
| `duration` (unset)                        | `null`  | `null`¹ | **omitted** |
| `playbackRate`                            | `1`     | `1`     | **omitted** |
| `sessionId` in payload                    | —       | —       | present     |

¹ `null` since `v5-3mg`; it was `0` before that, which is how the bug was found.

**Every field that carries user intent agrees on all three platforms.** The
three remaining differences are all benign and are _sender-SDK_ behaviour rather
than ours: an omitted `duration` and an omitted `playbackRate: 1` mean exactly
what `null` and `1` mean, and `sessionId` is added by the Chrome sender SDK's
own envelope. No action — recorded so the next person diffing payloads does not
mistake them for defects.

#### 🐛 Found and fixed: web was on the Default Media Receiver with the channel probe on

The `v5-5tx` fold-in left `playground/index.html` pointed at `CC1AD845` while
`CHANNEL_PROBE_ENABLED` was `true`. That is the documented session-killer, and
it reproduced on web exactly as it did natively on 08-02: **both `loadMedia`
calls RESOLVED**, then the receiver went `idle / idleReason: error`, with
`channel=registered` in the panel. Reads as a broken media pipeline; is not one.

Fixed by pointing web at `EA48D3FC` too. The rule generalises and is now written
into `index.html`: **receiver app id and `CHANNEL_PROBE_ENABLED` move together,
on every platform.**

#### ⚠️ The LAN fixtures are not durable

`test.mp4` / `test2.mp4` / `test3.mp4` live in the session scratchpad, which is
cleaned periodically — they vanished overnight, and the first symptom was a
`loadMedia` that resolved and then went `idle=error`, i.e. **the same signature
as the bug above**. Before diagnosing anything about media, check the fixture
server actually serves them:

```bash
curl -sI http://<mac>:8000/test.mp4 | head -1     # expect 200, not 404
```

Regenerate with the `ffmpeg` recipe in `probeFixtures.ts` (durations must come
back 600 / 15 / 20 s). Worth moving somewhere durable if this recurs.

#### 🐛 W7 — the non-Chromium message is misleading (found while answering the row)

Behaviour that is already right: `CastButton.web.tsx` does `if (!sdkReady)
return null`, so in Firefox/Safari **no cast button appears at all** — the same
thing YouTube does, and the correct default. Nothing crashes; mutations reject
`notSupported`.

The defect is the message. `SDK_UNAVAILABLE` in `CastTransport.web.ts` reads:

> The Google Cast Web Sender SDK is not available. Include `<script src="…cast_sender.js…">` in your page

In a non-Chromium browser that is **wrong advice** — the script _is_ included;
the browser simply cannot cast. It sends a developer to fix a non-problem. The
library already knows the difference: `__onGCastApiAvailable(available, reason)`
supplies a reason, and the transport maps `extension_not_compatible` /
`extension_missing` to `notSupported`. The information exists and is discarded.

Related, and a design question rather than a bug: `castState` seeds to
`noDevicesAvailable` in both cases, so an app cannot distinguish "Chrome, no
Chromecast on the network" from "Firefox, casting impossible" — there is no
signal to branch on if you want to hide a whole section of UI. Left as bead `v5-7zm`
rather than guessed at, since it touches public surface.

#### ✅ W7 run — Safari 26 / macOS, 2026-08-09 — **row closed, and both defects above are fixed**

`yarn playground web`, no Cast device involvement needed. Driven through Safari's
own JS bridge (Develop ▸ Developer Settings ▸ "Allow JavaScript from Apple
Events", then `osascript … do JavaScript … in document 1`) — which is how a
non-Chromium browser _can_ be automated after all, since the blocker was never
the browser, only Chrome-based tooling. Turn the setting back off afterwards.

| Assertion                     | Result                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| No launcher rendered          | ✅ nothing in the header — `CastButton.web`'s `if (!sdkReady) return null`                                                                 |
| A branchable "can I cast?"    | ✅ **`Supported: false`** in Safari, `true` in Chrome                                                                                      |
| Seeded state                  | ✅ `castState=noDevicesAvailable`, `Devices: 0`, `Session: none`, no exceptions                                                            |
| `show*` helpers resolve false | ✅ `showCastDialog`, `showExpandedControls`, `showIntroductoryOverlay` (both once flavours), `showPlayServicesErrorDialog` — all `→ false` |
| Mutations reject              | ✅ `probe: rejected code=notSupported`, `endCurrentSession rejected: notSupported`                                                         |

**Both halves of the `v5-7zm` finding are closed by what shipped.** The
`castState`-only ambiguity is gone — `useCastSupported()` / `isSupported()`
answer it directly, and Safari is the first place that has been checked against a
browser that genuinely cannot cast. And the misleading message is gone; the
rejection now reads:

> The Google Cast Web Sender SDK did not load. The loader script is present, so
> this is normally a browser that does not support casting — only Chromium-based
> browsers (Chrome, Edge) do. If this IS Chrome, the SDK may still be
> initializing: it announces itself asynchronously, so check `useCastSupported()`
> before issuing commands (see the "Web support" guide).

No developer is sent to fix a `<script>` tag that is already there.

**G8 and the whole web table are now ✅**, so the web prerequisite on the
5.0.0-beta tag is satisfied.

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

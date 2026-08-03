# Phase 3 — Native spike & integration checklist (device/simulator)

> **Carried forward.** The rows still open here — spike 0.3 teardown, the
> `resumeFailed` path, and finding #2 (Android route population on real
> hardware) — are now rows **1.4.9**, **2.2.13** and **1.1.3** of
> [`phase6-device-pass-checklist.md`](./phase6-device-pass-checklist.md), which
> is the live gate for the device pass (bead v5-8hq.6). Finding #1 was resolved
> in v5-xr6 / #625 and needs no device time. This document stays as the record
> of what Phase 3 proved.

The Phase 3 TypeScript keystone (transport seam, `CastStore`, façades) is fully
verified by `yarn typescript` + `yarn jest` (CI-runnable, device-independent).
The **native** behaviours below are device-gated and must be confirmed on a
simulator/emulator + a real Chromecast. They are the T1 spike assertions and the
T4 integration tests from the plan.

## Status at hand-off

| Gate                                              | iOS (sim, real Chromecast)                                             | Android (moto g05 + emulator)                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `yarn nitrogen` generates spec                    | ✅                                                                     | ✅                                                                       |
| Native module **compiles**                        | ✅ (`xcodebuild` NitroGoogleCast pod, GCK SDK)                         | ✅ (`:react-native-google-cast:compileDebugKotlin`, GCK + MediaRouter)   |
| Native module **loads + instantiates** on device  | ✅ (iPhone 17 sim)                                                     | ✅ device (arm64) + emulator (x86_64)                                    |
| Spike 0.1 — GCK event → JS callback               | ✅ full lifecycle `starting→started→resumed→ending→ended` + cast-state | ✅ ordered `starting→started→ending→ended` + cast-state, real Chromecast |
| Spike 0.2 — error carries `code`+`nativeCode`     | ✅ `code`/`message` (probe)                                            | ✅ `code`/`message` (probe) **and** `nativeCode=2161` (ended event)      |
| connect → disconnect → reconnect → new generation | ✅ session id stable across resume; new id on reconnect                | ✅ session id changes across reconnect                                   |
| Spike 0.3 — listener attach/detach/teardown clean | ⬜ (not explicitly exercised; `dispose()` not wired to UI)             | ⬜ (not explicitly exercised; `dispose()` not wired to UI)               |

**Both platforms verified end-to-end** against a real "Office TV" Chromecast via
the example spike harness (`example/App.tsx`):

- **Critical-gap #12 CLOSED.** Errors cross the Nitro bridge carrying `code`
  (thrown-error JSON channel, both platforms) and `nativeCode` (Android `ended`
  event, value `2161`, via the streamed-`CastError`-struct channel). The synthetic
  "device not found" probe correctly reports no `nativeCode`.
- **iOS optional-selector risk CLOSED.** Every `GCKSessionManagerListener` selector
  fires with the bridged Swift names used — `willStart` / `didStart` /
  `didResumeSession` / `willEnd` / `didEnd` all observed reaching JS.
- The full lifecycle streams in order through native listener → store → bus → façade
  on both platforms.

**Findings to follow up (not blockers):**

1. **iOS discovery does not auto-start** in the harness — devices only surfaced
   after an explicit `DiscoveryManager.startDiscovery()` call. Decide whether the
   transport should auto-start discovery on iOS (GCK `disableDiscoveryAutostart`)
   or whether apps/the CastButton (Phase 6) own that. Document either way.
   **RESOLVED (v5-xr6 / #625):** this is intended GCK behavior, not a wrapper
   bug — the default `GCKCastOptions.startDiscoveryAfterFirstTapOnCastButton`
   (iOS 14+ LNA design) gates discovery on the first `GCKUICastButton` tap, and
   the Phase 3 harness had no CastButton yet. Decision: the transport does NOT
   force-start discovery (it would fire the LNA prompt at cold launch and defeat
   GCK's battery/privacy design; Android's `CastContext`-managed discovery is
   equally interaction-gated). The CastButton owns the out-of-the-box path;
   custom pickers call `DiscoveryManager.startDiscovery()` (Google's own
   guidance). `isDiscovering` is now seeded from `GCKDiscoveryManager
.discoveryActive` at init. Documented in troubleshooting / CastButton /
   hooks docs.
2. **Android emulator did not surface the device list.** `castState` moved to
   `notConnected` (GCK saw the Cast device) but our `MediaRouter` route enumeration
   returned `devices=0` — whereas the physical device surfaced it at init. Likely
   emulator mDNS/route timing, but worth confirming `readDevices()` /
   `CastDevice.getFromBundle(route.extras)` isn't missing a route-population signal.

Remaining device-gated: explicit `dispose()` teardown (0.3) and the
suspend/`resumeFailed` paths (unit-tested in jest; resume was observed on iOS but
`resumeFailed` not deliberately triggered).

## Spike assertions (the gate that froze the seam — confirm post-hoc)

1. **0.1 — event stream.** Connect/disconnect a Chromecast; confirm JS receives
   `onState` (cast-state) and the `onLifecycle` session events in order, on the
   JS thread. (Most of this is already proven by the existing cast-state
   listener; the new surface is discovery `onDevices` + the session lifecycle.)
2. **0.2 — error propagation (#12).** Trigger a failing mutation (e.g.
   `startSession` with a bogus device id, or end with no session). Confirm the
   rejected `CastError` in JS carries the right `code` **and** a numeric
   `nativeCode`. The native side JSON-encodes the payload into the thrown error
   message (`castRejection` / `castRejectionJson`); the TS `parseCastError`
   decodes it. If Nitro turns out to preserve structured errors, simplify
   `src/transport/nativeErrors.ts` only (it is the single swappable spot).
3. **0.3 — teardown.** Call `dispose()` (Fast Refresh / unmount); confirm all GCK
   observers detach and no listener leaks across sessions.

## iOS-specific verification

- The `GCKSessionManagerListener` methods in `HybridCastTransport.swift` are
  **optional** protocol methods — a wrong bridged Swift selector compiles but
  silently never fires. Confirm each lifecycle event actually arrives in JS; fix
  any selector whose Swift name the importer renders differently (esp.
  `didResumeSession` / `willResumeSession` / `didSuspend(_:withReason:)`).
- Confirm `dispose()` overrides `HybridObject.dispose()` (the C++ wrapper calls
  it) and that discovery `onDevices` populates once a Cast button triggers an
  active scan (iOS 14+ requires the user to grant permission once).

## Android-specific verification

- The Kotlin **compiles** (`:react-native-google-cast:compileDebugKotlin`)
  against the GCK + MediaRouter APIs; runtime behaviour is still device-gated.
- Discovery uses `MediaRouter` + `CastContext.getMergedSelector()`. Per the
  project memory, devices only surface once an on-screen Cast button (Phase 6)
  triggers an active scan — so device-list E2E may defer to Phase 6; the session
  lifecycle, cast-state, `endCurrentSession`, and `playServicesState` paths are
  testable now.
- Confirm `onSessionResumeFailed` (Android-only) reaches the store and clears the
  dead session (the reducer is unit-tested; verify the native event fires).

## Phase 3 integration tests (T4, on emulator/sim)

- listener registration + initial-snapshot replay (no event lost between attach
  and snapshot — the atomic `initAndSubscribe`);
- background → resume of a session;
- no-device failure path (`startSession` rejects, app does not crash);
- post-disconnect mutation rejects `noSession` (does not crash).

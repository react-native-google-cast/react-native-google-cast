# Agent & Contributor Instructions

`react-native-google-cast` — a React Native wrapper for the Google Cast SDK (iOS + Android).

This file is the **single source of truth** for both AI agents and human contributors.
Claude Code reads `CLAUDE.md`, which just points here, so the two never drift.

## Project status: v5 rewrite

- **`main`** carries the stable **v4** line (old-architecture `RCTBridgeModule`). v4 is in
  maintenance mode — bug fixes only.
- **`v5`** is a ground-up rewrite onto the React Native **New Architecture** using **Nitro Modules**.

v5 architecture in one line: **thin Nitro bridge + fat TypeScript** — a single native transport with
thin TS façades (`CastSession`/`RemoteMediaClient`/`CastChannel`) over a central session-state machine
driven by native session events (no stateful native objects, so no use-after-free on disconnect).
The public roadmap is the GitHub **`v5` milestone**.

## Build & test

```bash
yarn                 # install (there is no `yarn bootstrap`)
yarn typescript      # tsc --noEmit
yarn lint            # eslint
yarn test            # jest
yarn prepare         # bob build (library output)
yarn specs           # nitrogen — only when a .nitro.ts spec changes (then re-run pod install)

yarn playground start          # Metro for the playground app (playground/)
yarn playground android|ios
```

### The two gates that need a device, and when they are not optional

`yarn test` does **not** cover the struct↔GCK converters. Those are pinned by the
shared golden corpus in `fixtures/converters/**`, which **both** native suites
assert against — that corpus exists precisely to catch cross-platform drift:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd playground/android && ./gradlew :react-native-google-cast:connectedDebugAndroidTest   # needs a device/emulator
cd playground/ios && xcodebuild test -workspace CastPlayground.xcworkspace \
  -scheme NitroGoogleCastTests -destination "id=<simulator-udid>"
```

**A converter change is a corpus change.** If you touch anything under
`ios/NitroGoogleCast/Converters/` or
`android/src/main/java/com/margelo/nitro/googlecast/converters/`, update
`fixtures/converters/**` in the same commit and run both suites — JS gates stay
green either way, so nothing else will tell you. (This is not hypothetical: it
left both native gates red on `v5` for two days. See bead `v5-eb4`.)

Two traps when reading a failure:

- JUnit aborts a test at its first failing assertion, so CI can be hiding a
  second stale expectation behind the one it reports.
- Some expectations live in test **code**, not the corpus — genuine per-platform
  divergences are asserted with an explicit branch and an `ANDROID DIVERGENCE`
  comment. Closing a divergence means deleting its branch.

The corpus is deliberately **not** prettier-formatted (compact hand style). Edit
it structurally; do not run prettier over it.

## Conventions

- TypeScript for all JS-layer code; keep listener fan-out, hooks, and the session-state machine in TS.
- Run `yarn typescript`, `yarn lint`, and `yarn test` before opening a PR.
- Follow existing patterns in `src/`; match surrounding style.

## Native threading & async-request policy (v5)

Binding rules for all native code in `ios/NitroGoogleCast/` and
`android/src/main/java/com/margelo/nitro/googlecast/`. The two transports
(`HybridCastTransport.swift` / `HybridCastTransport.kt`) are the reference implementations.

1. **All GCK/MediaRouter access on the main thread.** Every SDK call, every listener
   add/remove, and every session/client resolution happens inside a main-thread hop
   (`DispatchQueue.main.async` / `runOnMain`) — Nitro methods are entered on the JS thread and
   must hop before touching the SDK. Enforced mechanically where cheap:
   `dispatchPrecondition(.onQueue(.main))` (iOS) and `MainThread.assertMainThread` (Android,
   debuggable hosts only) guard the listener registries and attach/detach/flush helpers.
2. **Never cache a session handle for later use (Invariant 1).** Re-resolve
   `currentCastSession` / `remoteMediaClient` from the GCK singletons inside the hop on every
   call. The only stored handles are the _listener-attachment_ trackers
   (`attachedMediaClient` / `observedClient`, etc.), which exist solely so detach targets the
   exact instance attach used — never for issuing operations.
3. **Async requests settle exactly once and never outlive their session.** Copy the canonical
   pattern — `CastRequestDelegate` + `track()` (iOS), `TrackedCastRequest` + `track()`
   (Android): every `GCKRequest` / `PendingResult` is retained in the transport's
   `pendingRequests` registry until settled; the first of {result, failure, abort, external
   cancel} wins and later callbacks are no-ops; the transport flushes stragglers (reject
   `interrupted` + GCK-cancel) on session end, session suspend, and `dispose()` (RN reload),
   so a JS promise can never hang on a dead session. Never fire-and-forget a request.
4. **JS callbacks: main thread, no locks, no dead contexts.** The stored `initAndSubscribe`
   callbacks are invoked from the main thread only and never while any lock is held;
   `dispose()` nulls them (and detaches the debug seam) so nothing fires into a torn-down JS
   runtime. Any state read synchronously from the JS thread but written on main must be
   `@Volatile` (Android) / lock-boxed (iOS `AtomicFlag`); everything else stays
   single-thread-affine.

Teardown invariants — all must hold after session end/suspend AND after `dispose()`: every
listener detached from the exact instance it attached to (attach/detach symmetric), channel
registries cleared, pending requests flushed, and (dispose only, with a strong self-capture so
cleanup cannot be skipped) callbacks nulled.

## Task tracking (maintainers — optional)

Maintainers coordinate v5 work with **beads** (`bd`), a local dependency-aware task graph. This is
**optional** and **not required to build, test, or contribute**. The beads store (`.beads/`), its
git/codex hooks, and the beads skill are local tooling and are gitignored — they are intentionally
not part of the repo.

- **If you use beads** (`bd` installed, `.beads/` present): `bd ready` shows available work; see the
  beads skill for the full workflow. To get the shared graph on a new machine, configure the Dolt
  remote and `bd dolt pull`.
- **If you don't**: ignore beads entirely. Use whatever task tracking you prefer (GitHub issues,
  your editor's TODOs, etc.). Contribution and review happen through GitHub as usual.

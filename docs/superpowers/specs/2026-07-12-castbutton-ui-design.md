# CastButton + Cast UI dialogs — design (Phase 6, slice 6.1, epic `v5-8hq`)

**Status:** approved design, pre-implementation
**Date:** 2026-07-12
**Beads:** `v5-8hq.1` (this design), `v5-8hq.2`–`.6` (barrier / TS / iOS / Android / integration+device pass)

## Goal

The first UI slice of the v5 Nitro rewrite: the `<CastButton />` view (the repo's
**first Nitro HybridView**), the three `CastContext.show*` Cast-UI methods
(`showCastDialog` / `showExpandedControls` / `showIntroductoryOverlay`), and the
four remaining v4 hooks (`useCastState` / `useCastSession` / `useCastDevice` /
`useDevices`) — plus example-app wiring and the Phase 6 device pass. Landing a
real on-screen Cast button also unblocks **real Android device discovery** (GCK
only starts an ACTIVE scan once a MediaRouteButton/chooser is on screen), so the
device-gated P5 checks (`v5-vlv` item 4) fold into this slice's device pass.

Slice 6.2 (separate, bead `v5-9yc`) covers the non-method parity remainder:
OptionsProvider/notifications, expanded-controller/image-selection options, and
the Expo plugin v5 rewrite.

## Decisions (locked with the driver)

- **Android `showCastDialog` shows the MediaRouter dialogs directly** — no
  mounted-button requirement. v4 required a rendered `CastButton` and called
  `performClick()` on it (resolving `false` with no button); v5 constructs
  `MediaRouteChooserDialog` / `MediaRouteControllerDialog` itself, an
  improvement documented in the migration guide.
- **`showIntroductoryOverlay` resolves `false` when there is no (visible)
  CastButton** on screen — on both platforms. Fixes the v4 Android bug where the
  promise simply never settled without a button.
- **iOS overlay uses the non-deprecated anchored API**
  `presentCastInstructionsViewControllerOnce(with: GCKUICastButton)` — so iOS
  needs a button anchor too (v4 used the deprecated anchorless form).
- **v4-faithful surface**, same naming, so migration stays mechanical.

## Public API (v4-faithful)

```tsx
// Component — new src/components/CastButton.tsx
<CastButton tintColor="#fff" style={{ width: 24, height: 24 }} {...viewProps} />

// CastContext façade additions (all delegate to the transport)
showCastDialog(): Promise<boolean>
showExpandedControls(): Promise<boolean>
showIntroductoryOverlay(options?: { once?: boolean }): Promise<boolean> // once defaults to true

// Hooks (src/api/use*.ts)
useCastState(): CastState
useCastSession(options?: { ignoreSessionUpdatesInBackground?: boolean }): CastSession | null
useCastDevice(): Device | null
useDevices(): readonly Device[]
```

**`show*` return contract:** the boolean means *"was the UI actually shown"*.
`showCastDialog` resolves `true` once the dialog is presented (`false` when no
Activity / Cast framework on Android); `showExpandedControls` likewise;
`showIntroductoryOverlay` resolves `false` when no visible CastButton anchor
exists or (with `once`) when the overlay was already shown before. Resolution
*timing* is platform-faithful: Android's overlay resolves on dismissal (v4
behavior), iOS resolves at presentation — documented, not normalized.

**`useCastState` returns `CastState`, not `CastState | null`** (deviation from
the epic plan's sketch): v4 returned `null` only before its async init; the v5
store seeds synchronously, so `null` is unrepresentable. The narrower type is
drop-in assignable for migrating v4 code.

**`useCastSession({ ignoreSessionUpdatesInBackground })` is best-effort** in
v5's generation-bound world: the option suppresses the `null` flash while the
session is suspended (iOS backgrounding), but on `resumed` the hook must hand
out the **fresh** generation-bound façade — retaining the pre-suspend object
(v4's behavior) would leave callers a stale façade whose every call rejects
`noSession`. Guidance for effect identity: key effects on `castSession?.id`
(stable across suspend/resume of the same session), not the object. Documented
in the hook JSDoc + migration guide.

## Architecture

### Transport surface (`CastTransportApi` + `CastTransport.nitro.ts` + fake) — 6.1a barrier

```ts
// --- Cast UI surface (Phase 6.1) ---
showCastDialog(): Promise<boolean>
showExpandedControls(): Promise<boolean>
showIntroductoryOverlay(once: boolean): Promise<boolean>
```

- Flat `once: boolean` at the transport layer (the options object lives in the
  façade). `once` is not a C++ reserved word (nitrogen emits param names
  verbatim into generated C++ — known hazard).
- **No new state slices, no new StoreEvents, no `initAndSubscribe` change** —
  these are imperative one-shots; nothing streams back.
- All three drift surfaces updated in lockstep: `src/transport/types.ts`,
  `src/specs/CastTransport.nitro.ts`, `src/transport/__fakes__/FakeCastTransport.ts`
  (recorded calls + scriptable behaviors, defaults resolve `true`).
- **Adapter** (`CastTransport.ts`): same `parseCastError` translation as other
  mutations, via a value-returning variant of the `mutate` helper (the existing
  one is `Promise<void>`-only).
- **Web stub**: all three resolve `false` — the contract is "was it shown", and
  on web it never is. (Deliberately *not* `notSupported` rejections: these are
  UI affordances, not state mutations; a graceful `false` matches the native
  no-button/no-activity paths.)

### CastButton Nitro view spec — 6.1a barrier

New `src/specs/CastButton.nitro.ts`:

```ts
import type {
  HybridView,
  HybridViewProps,
  HybridViewMethods,
} from 'react-native-nitro-modules'

export interface CastButtonProps extends HybridViewProps {
  /** Processed AARRGGBB color int (RN `processColor` output); wrapper converts. */
  tintColor?: number
}
export interface CastButtonMethods extends HybridViewMethods {}
export type CastButton = HybridView<CastButtonProps, CastButtonMethods>
```

- `tintColor` crosses the bridge as a **processed color number** — keeps the
  spec primitive (no platform ColorValue type in Nitro); the React wrapper does
  `processColor()`.
- **`nitro.json` needs a `CastButton` autolinking entry** (correction to the
  epic plan, which assumed auto-discovery): verified in nitrogen 0.35.10 —
  `views/swift/SwiftHybridViewManager.js` throws *"must be autolinked with a
  Swift iOS implementation in nitro.json"* when the entry is missing. Views are
  auto-*detected* as views from the `HybridView<>` alias, but still need the
  autolinking implementation mapping:

```json
"CastButton": {
  "ios": { "language": "swift", "implementationClassName": "HybridCastButton" },
  "android": { "language": "kotlin", "implementationClassName": "HybridCastButton" }
}
```

- `yarn specs` regenerates `nitrogen/generated/**`; the barrier commit includes
  it. First HybridView in the repo → the barrier eyeballs the generated
  podspec/gradle glue (`*Config.json` on the shared side, ComponentDescriptor
  C++/mm/Kotlin view managers per platform); the native lanes own making it
  compile. Nitro views require RN 0.78+ + new architecture — example is RN 0.86
  with `newArchEnabled=true`.

### React wrapper + hooks (TS lane) — 6.1b

- **`src/components/CastButton.tsx`**: wraps the generated host component
  (`getHostComponent<CastButtonProps, CastButtonMethods>('CastButton', () =>
  CastButtonConfig)` with the nitrogen-generated view config JSON). Public props:
  `ViewProps & { tintColor?: ColorValue }`; converts via `processColor` before
  passing down. No methods, no `hybridRef` exposure (nothing imperative on the
  button).
- **`CastContext.show*`**: thin delegation to `castTransport`;
  `showIntroductoryOverlay` applies the `once ?? true` default.
- **Hooks:**
  - `useCastState` — `useSyncExternalStore(castStore.subscribe, () =>
    castStore.getSnapshot().castState)`.
  - `useDevices` — same pattern over `snapshot.devices` (frozen, ref-stable).
  - `useCastDevice` — same pattern over `snapshot.currentSession?.device ?? null`
    (device is frozen per session → ref-stable, Invariant 2).
  - `useCastSession` — v4-shaped: `useState` seeded synchronously from
    `CastContext.getSessionManager().getCurrentCastSession()` (memoized per
    generation → ref-stable), updated from the SessionManager lifecycle events
    (`started`/`resumed`/`ended`/`startFailed`/`resumeFailed`, plus `suspended`
    → `null` unless `ignoreSessionUpdatesInBackground`). Re-subscribes when the
    option flips. See the best-effort note above for resume identity.
- `src/index.ts` exports: `CastButton` (+ its props type), the 4 hooks.
- Docs: `docs/components/CastButton.md`, `docs/components/ExpandedController.md`,
  `docs/guides/hooks.md`, migration-guide entries (dialog-without-button
  improvement, overlay `false` fix, `useCastSession` resume-identity note).

### iOS (`ios/NitroGoogleCast/`) — 6.1c

- **`HybridCastButton.swift`**: implements the generated view spec. Creates
  **one** `GCKUICastButton` in `init` and returns it as (or inside) the spec's
  `view` (fixes the v4 bug of re-creating the button every `layoutSubviews`).
  `tintColor` prop setter maps the processed int → `UIColor` (nil → default).
  Registers itself in the registry on init; unregisters on `deinit` (weak refs
  make this belt-and-braces). Implements `prepareForRecycle` (reset tint,
  re-register) and `memorySize` (small constant) per Nitro view conventions.
- **`CastButtonRegistry.swift`**: ordered list of **weak** button refs,
  *last-attached wins*: `current` returns the most recently registered button
  whose view is in a window (visible anchor), else `nil`. Main-thread only.
- **`HybridCastTransport.swift` show\* impls** (all hop to the main queue,
  `[weak self]`, re-resolve `GCKCastContext.sharedInstance()` per call —
  Invariant 1):
  - `showCastDialog` → `presentCastDialog()`, resolve `true`.
  - `showExpandedControls` → `presentDefaultExpandedMediaControls()`, resolve `true`.
  - `showIntroductoryOverlay(once)` → if `!once`, `clearCastInstructionsShownFlag()`
    first; `guard let button = CastButtonRegistry.current else resolve(false)`;
    resolve `presentCastInstructionsViewControllerOnce(with: button)` (its
    `Bool` = actually presented).

### Android (`android/src/main/java/com/margelo/nitro/googlecast/`) — 6.1d

- **`HybridCastButton.kt`**: constructed with the `ThemedReactContext` nitrogen's
  generated ViewManager passes in. Wraps a `MediaRouteButton` built with the v4
  dance: `ContextThemeWrapper(context, Theme_MediaRouter)` → obtain
  `externalRouteEnabledDrawable` → `setRemoteIndicatorDrawable(drawable)`
  **before** `CastButtonFactory.setUpMediaRouteButton(...)` (else wrong initial
  visual state); tint via `DrawableCompat.wrap` + `setTint` re-applied whenever
  the drawable or prop changes. Registers in the registry on
  `View.onAttachedToWindow`, unregisters on detach + `onDropView` (v4 pattern).
- **`CastButtonRegistry.kt`**: mirror of the iOS registry (weak refs,
  last-attached wins, `current` requires `visibility == VISIBLE` for the
  overlay anchor). The registry exists **only** for the overlay — dialogs no
  longer need a button (see Decisions).
- **`HybridCastTransport.kt` show\* impls** (main thread, re-resolve
  `CastContext.getSharedInstance(...)` and the current Activity per call;
  resolve `false` when either is unavailable):
  - `showCastDialog` → if a cast session is connected,
    `MediaRouteControllerDialog(activity)`; else `MediaRouteChooserDialog(activity)`
    with `castContext.mergedSelector`. Both constructed on the current Activity
    (MediaRouter-themed wrapper) — direct construction, no `performClick()`.
  - `showExpandedControls` → `Intent(context, NitroExpandedControllerActivity::class.java)`
    + `FLAG_ACTIVITY_NEW_TASK`, resolve `true`.
  - `showIntroductoryOverlay(once)` → anchor = `CastButtonRegistry.current`
    (visible) else **resolve `false`** (fixes the v4 never-settles hang);
    `IntroductoryOverlay.Builder(activity, button)`, `setSingleTime()` when
    `once`, resolve `true` in `setOnOverlayDismissedListener` (v4 timing).
- **`NitroExpandedControllerActivity.kt`** + `res/menu/cast_expanded_controller_menu.xml`
  ship in 6.1 (v4 port: extends GCK's `ExpandedControllerActivity`, inflates the
  menu, `CastButtonFactory.setUpMediaRouteButton(this, menu, R.id.media_route_menu_item)`).
  The **example app** registers it in its own `AndroidManifest.xml`; consumer
  manifest/Expo-plugin wiring is 6.2.

### Invariants carried over

Re-resolve CastContext/session per call (Invariant 1); UI work on the main
thread only; `[weak self]` in every async hop; registries hold weak refs and
are cleared on detach; promises settle exactly once.

## Error handling

- `show*` **resolve `false`** for the graceful can't-show cases (no Activity, no
  Cast framework, no visible button anchor, overlay already shown once) — they
  do not reject for those.
- They **reject a typed `CastError`** only for genuine failures (unexpected
  native throw), translated by the existing adapter `parseCastError` path.
- The CastButton view never throws across the bridge: a missing Cast framework
  degrades to v4 behavior (button renders in its default state; Android wraps
  `setUpMediaRouteButton` in try/catch exactly like v4).

## Testing

**jest (`FakeCastTransport`)** — no device needed:
- `CastContext.show*` delegate to the transport and pass through resolutions
  (`true`/`false`) and rejections; `showIntroductoryOverlay` defaults `once` to
  `true` and forwards an explicit `false`.
- `useCastState` re-renders on `state` events; `useDevices` on `devices`
  events (ref-stable when unchanged); `useCastDevice` flips device ↔ `null`
  across session lifecycle.
- `useCastSession`: session on `started`, `null` on `ended`, `null` on
  `suspended` by default, **retained** on `suspended` with
  `ignoreSessionUpdatesInBackground`, fresh façade on `resumed`.
- `CastButton` wrapper: renders the host component, converts `tintColor`
  strings via `processColor`, passes `style`/ViewProps through
  (react-test-renderer, per existing façade test patterns).

**Converter parity:** none — no new structs (booleans/numbers only).

**Device-gated** (real hardware; Android priority — emulators cannot discover
Cast devices):
- Android: CastButton renders + triggers the ACTIVE scan → **real Chromecast
  discovery** (closes the long-standing emulator gap); chooser dialog via
  button *and* via `showCastDialog` (no button mounted); controller dialog when
  connected; overlay (incl. `false` w/o button); expanded controls activity.
- iOS: dialog / overlay / expanded-controls parity.
- **Fold in `v5-vlv` item 4**: CastChannel registration-time handshake delivery,
  plus any remaining P5 device-gated checks.

## Decomposition (barrier-first, same lane shape as 5.2)

- **`v5-8hq.2` (6.1a)** — barrier, lands inline on `v5` (native intentionally
  non-compiling until the lanes — T1a convention): transport `show*` on all 3
  drift surfaces + adapter + web stub; `CastButton.nitro.ts` + `nitro.json`
  autolinking entry; `yarn specs` regen committed. `yarn typescript`/`yarn
  test`/prettier green. **CHECK IN with the driver before fanning out.**
- **`v5-8hq.3` (6.1b, TS lane)** — branch `petrbela/p61-ts`, `src/` + `docs/`
  only: CastButton wrapper, `CastContext.show*`, 4 hooks, exports, jest, docs.
- **`v5-8hq.4` (6.1c, iOS lane)** — branch `petrbela/p61-ios`, `ios/` only:
  HybridCastButton + registry + transport show* impls; compile gate
  `xcodebuild … -target NitroGoogleCast`.
- **`v5-8hq.5` (6.1d, Android lane)** — branch `petrbela/p61-android`,
  `android/` only: HybridCastButton + registry + dialogs +
  NitroExpandedControllerActivity + menu resource; compile gate
  `compileDebugKotlin`.
- **`v5-8hq.6` (integration + device pass)** — branch `petrbela/phase6.1`:
  `--no-ff` merge the 3 lanes; example wiring (CastButton in the header, show*
  buttons, manifest registration); quality gates + two-stage subagent review;
  single squashed PR to v5 (driver approves merge); then the device pass above.

## Eng-review amendments (2026-07-12)

Accepted findings from the eng review (4-section pass + outside-voice
cross-model challenge). Where an amendment contradicts a body section above,
the amendment wins.

- **E1 — Android ViewManager registration (P1).** Nitrogen generates
  `HybridCastButtonManager` (package `com.margelo.nitro.googlecast.views`) but
  registers **nothing** into RN's ViewManager registry — neither the generated
  autolinking nor `NitroModulesPackage` does it (verified in nitrogen 0.35.10 +
  core sources). The Android lane must change
  `NitroGoogleCastPackage.createViewManagers()` to return
  `listOf(HybridCastButtonManager())` and update the package's now-stale
  "intentionally provides no view managers" doc comment. Without this the
  button compiles clean and fails only at runtime. iOS needs no counterpart:
  the generated `.mm` self-registers via `+load` →
  `RCTComponentViewFactory registerComponentViewClass:`.
- **E2 — Android overlay owns its own "once" flag (P1 — kills the second v4
  hang).** GCK Android's `IntroductoryOverlay` with `setSingleTime()` silently
  no-ops `show()` when the overlay was ever shown before and never fires the
  dismiss listener — v4's promise hung in that case too, not just the
  no-button case. v5 therefore does **not** use `setSingleTime()` at all: the
  transport tracks shown-state in its own SharedPreferences flag. `once=true`
  + flag set → resolve `false` immediately; otherwise build the overlay
  *without* single-time, and on dismiss set the flag + resolve `true`. Every
  path settles. (iOS keeps GCK's native flag — its API returns `BOOL` and has
  `clearCastInstructionsShownFlag`.) Platform note: the two "once" flags are
  independent stores; documented in the guide. *PR #611 review addendum:* the
  promise settles at presentation, not dismissal — GCK's dismiss listener is a
  user-interaction callback and never fires if the Activity dies with the
  overlay up; the listener only records the once-flag.
- **E3 — `CastButton.web.tsx` split (P2).** `getHostComponent` deep-imports
  `react-native/Libraries/NativeComponent/NativeComponentRegistry`, which
  react-native-web does not provide — importing the native wrapper breaks web
  *bundling*, not just runtime. The TS lane adds a `CastButton.web.tsx` that
  renders `null` (graceful degradation, matches the web transport stub).
- **E4 — `useCastSession` simplified + race closed (P2).** Default (no
  options) path is plain
  `useSyncExternalStore(castStore.subscribe, () => sessionManager.getCurrentCastSession())`
  — race-free and consistent with the other hooks (the body's event-based
  sketch is superseded for this path). The event-based path exists **only**
  for `ignoreSessionUpdatesInBackground`, and closes the seed→subscribe mount
  gap by subscribing first, then synchronously re-reading
  `getCurrentCastSession()` inside the effect.
- **E5 — `ignoreSessionUpdatesInBackground` honesty (P2, docs).** The option
  is retained for v4 parity but its v5 value is narrower: it suppresses the
  `null` render during suspension, and the retained façade is inert while
  suspended (mutations reject `noSession` — materially the same as v4, whose
  retained object also failed natively while the session was suspended). On
  `resumed` the hook always hands out the fresh generation-bound façade (new
  reference). Both gaps go in the hook JSDoc + migration guide; effect
  identity guidance stays "key on `castSession?.id`".
- **E6 — `useCastDevice(options?)` keeps its v4 parameter (P3).** v4's
  `useCastDevice` delegates to `useCastSession(options)`; dropping the
  parameter silently changes suspension behavior. v5 mirrors: implemented as
  `useCastSession(options)`, returning the session's device (ref-stable per
  session), so the option keeps the device visible across a suspension.
- **E7 — `show*` boolean contract reworded (P3, docs).** iOS
  `presentCastDialog` / `presentDefaultExpandedMediaControls` are `void`, and
  Android's expanded-controls `startActivity` cannot observe what GCK's
  activity does next. Honest contract: `true` = "the present/launch call was
  issued"; only `showIntroductoryOverlay` verifies actual presentation. Public
  JSDoc + the body's contract paragraph read accordingly.
- **E8 — `showExpandedControls` misconfiguration is a typed rejection, not a
  hang or crash (P3).** Android catches `ActivityNotFoundException` and
  rejects a `CastError` (`notSupported`) whose message says to register
  `NitroExpandedControllerActivity` in the app manifest (automatic wiring →
  6.2). Missing-activity is a config error and must be loud; only "no current
  Activity" resolves `false`.
- **E9 — MediaRouter dialogs via DialogFragments (P3).** Raw
  `MediaRouteChooserDialog`/`MediaRouteControllerDialog` leak their window on
  rotation. `showCastDialog` uses
  `MediaRouteChooserDialogFragment` / `MediaRouteControllerDialogFragment` on
  the current activity's `supportFragmentManager` (ReactActivity is a
  FragmentActivity), which are lifecycle-managed; resolve `false` when the
  activity is missing, finishing, or not a FragmentActivity. Chooser-vs-
  controller branch: controller when `sessionManager.currentCastSession` is
  non-null (covers `connecting` too, matching MediaRouteButton), else chooser
  with `mergedSelector`.
- **E10 — Registries aligned on attach-order (P3).** Both platforms register
  on attach-to-window and unregister on detach (Android:
  `onAttachedToWindow`/`onDetachedFromWindow` + `onDropView`; iOS: a small
  host-view `didMoveToWindow` hook), so "last attached wins" resolves
  identically. iOS `prepareForRecycle` unregisters; the anchor check is
  attached + visible (`!isHidden` / `visibility == VISIBLE`).
- **E11 — `tintColor` reset path (P3).** Nitrogen's generated prop parser
  keeps the cached value when a key is *absent* from the prop diff, so
  removing the prop would strand the old tint. The React wrapper therefore
  always includes the key — `tintColor={processColor(tintColor) ?? null}` —
  and native treats nil/absent-value as "reset to default color".
- **Rejected — `useCastState(): CastState | null`.** The outside voice argued
  the seeded `'noDevicesAvailable'` is an affirmative answer where v4's `null`
  meant "unknown (still initializing)". Rejected for the hook signature: the
  synchronous seeded store is a Phase 3 core decision already shipped in
  `CastContext.getCastState()`, and the hook must match it. Accepted as a
  migration-guide note ("during the brief native-init window v5 reports
  `noDevicesAvailable` where v4 reported `null`").

## Non-goals / deferred (→ 6.2, bead `v5-9yc`)

- OptionsProvider guidance/refresh, notifications & lock-screen controls,
  expanded-controller customization, image selection (`GCKUIImagePicker` /
  `ImagePicker`), Expo config-plugin v5 rewrite, consumer-manifest wiring for
  the expanded controller.
- CastButton `triggersDefaultCastDialog` prop (v4 never exposed it either).
- Web implementations of the UI surface (Phase 8).

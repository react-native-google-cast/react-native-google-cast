# CastButton + Cast UI (Phase 6 Slice 6.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the `<CastButton />` Nitro HybridView (first in the repo), `CastContext.showCastDialog` / `showExpandedControls` / `showIntroductoryOverlay`, and the 4 remaining v4 hooks (`useCastState` / `useCastSession` / `useCastDevice` / `useDevices`) — plus example wiring and the Phase 6 device pass (which also unlocks real Android discovery).

**Architecture:** one barrier (Task 1) lands the transport `show*` surface + the `CastButton.nitro.ts` view spec + the `nitro.json` autolinking entry + regenerated `nitrogen/generated/**` inline on `v5`; then three disjoint lanes fan out — TS (Tasks 2–5), iOS (Task 6), Android (Task 7) — and Task 8 assembles. No new state slices, no new StoreEvents, no `initAndSubscribe` change: the `show*` methods are imperative one-shots.

**Tech Stack:** TypeScript + Nitro Modules 0.35.10 (HybridView codegen), jest + `FakeCastTransport` + react-test-renderer, Swift/GCK 4.8.4 (iOS), Kotlin/play-services-cast-framework + androidx.mediarouter (Android).

**Spec:** `docs/superpowers/specs/2026-07-12-castbutton-ui-design.md` — **including the E1–E11 eng-review amendments, which are folded into every task below.**

**Verification commands (used throughout):**

```bash
yarn typescript                      # tsc --noEmit (drift guard)
yarn test                            # jest
npx prettier --check "src/**/*.ts" "src/**/*.tsx"
yarn specs                           # nitrogen codegen (NOT `yarn nitrogen`)

# Android compile check (from example/android):
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew :react-native-google-cast:compileDebugKotlin

# iOS compile check (after `pod install` in example/ios — nitrogen output changed):
xcodebuild -project example/ios/Pods/Pods.xcodeproj -target NitroGoogleCast \
  -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

**Parallelization:** Task 1 is the barrier (inline on `v5`, pushed; **CHECK IN with the driver before fanning out**). Tasks 2–5 = lane B (branch `petrbela/p61-ts`, `src/` + `docs/`), Task 6 = lane C (`petrbela/p61-ios`, `ios/`), Task 7 = lane D (`petrbela/p61-android`, `android/`) — all three branch from the Task 1 commit; disjoint dirs ⇒ no contention. Task 8 assembles on `petrbela/phase6.1`.

**Beads:** Task 0 already done (`v5-8hq.1` closed; `.2`–`.6` cut with full descriptions). Tag commits: barrier `v5-8hq.2`, TS `v5-8hq.3`, iOS `v5-8hq.4`, Android `v5-8hq.5`, integration/device `v5-8hq.6`.

---

### Task 1: 6.1a — Transport surface + CastButton spec (BARRIER, bead `v5-8hq.2`)

Lands inline on `v5`. After this task: `yarn typescript` + `yarn test` + prettier green; **native intentionally does not compile** until Tasks 6/7 (T1a convention — PR CI is the authoritative native gate).

**Files:**
- Modify: `src/transport/types.ts` (3 methods, new Cast-UI section)
- Modify: `src/specs/CastTransport.nitro.ts` (mirror)
- Modify: `src/transport/CastTransport.ts` (generic `mutate<T>`)
- Modify: `src/transport/CastTransport.web.ts` (resolve-false stubs)
- Modify: `src/transport/__fakes__/FakeCastTransport.ts` (records + behaviors)
- Create: `src/specs/CastButton.nitro.ts`
- Modify: `nitro.json` (CastButton autolinking entry — **required**, nitrogen throws without it)
- Regenerate: `nitrogen/generated/**` via `yarn specs`

- [ ] **Step 1: `src/transport/types.ts`** — add after the custom-channel section:

```ts
  // --- Cast UI surface (Phase 6.1) ---
  //
  // Imperative one-shots presenting GCK's own UI. Nothing streams back and no
  // state is cached. The boolean means "the present/launch call was issued";
  // only `showIntroductoryOverlay` verifies actual presentation (E7). The
  // graceful can't-show cases resolve `false` (no Activity, no visible
  // CastButton anchor, overlay already shown once) — genuine native failures
  // reject a typed CastError via the adapter. All UI work on the main thread;
  // CastContext/Activity re-resolved per call (Invariant 1).

  /**
   * Show the Cast dialog: the device chooser, or on Android the in-session
   * controller dialog when a session exists. Unlike v4, no mounted CastButton
   * is required. Resolves `false` when there is no Activity (Android).
   */
  showCastDialog(): Promise<boolean>
  /**
   * Present the platform's default expanded media controls. Android launches
   * `NitroExpandedControllerActivity` (must be registered in the app manifest;
   * missing registration rejects `notSupported` — E8).
   */
  showExpandedControls(): Promise<boolean>
  /**
   * Present the introductory overlay anchored to the currently attached,
   * visible CastButton. Resolves `false` with no anchor or (with `once`) when
   * already shown before. Android resolves on dismissal; the once-flag is
   * platform-local (iOS: GCK's flag; Android: our own SharedPreferences — E2).
   */
  showIntroductoryOverlay(once: boolean): Promise<boolean>
```

- [ ] **Step 2: `src/specs/CastTransport.nitro.ts`** — mirror:

```ts
  // Cast UI surface (Phase 6.1) — imperative one-shots; mirrors
  // `CastTransportApi` (drift guard in `__fakes__/FakeCastTransport.ts`).
  showCastDialog(): Promise<boolean>
  showExpandedControls(): Promise<boolean>
  showIntroductoryOverlay(once: boolean): Promise<boolean>
```

(`once` is not a C++ reserved word — safe as a nitrogen param name.)

- [ ] **Step 3: `src/transport/CastTransport.ts`** — make the wrapper generic (existing call sites unchanged), then add:

```ts
async function mutate<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op()
  } catch (error) {
    throw parseCastError(error)
  }
}
```

```ts
  // Cast UI one-shots — same error-translation wrapper.
  showCastDialog: () => mutate(() => hybrid.showCastDialog()),
  showExpandedControls: () => mutate(() => hybrid.showExpandedControls()),
  showIntroductoryOverlay: (once) =>
    mutate(() => hybrid.showIntroductoryOverlay(once)),
```

- [ ] **Step 4: `src/transport/CastTransport.web.ts`** — the contract is "was it shown", so web resolves `false` (not `notSupported`):

```ts
function neverShown(): Promise<boolean> {
  return Promise.resolve(false)
}
```

```ts
  showCastDialog: neverShown,
  showExpandedControls: neverShown,
  showIntroductoryOverlay: neverShown,
```

- [ ] **Step 5: `src/transport/__fakes__/FakeCastTransport.ts`** — records next to the existing recorded-call fields, behaviors next to the existing behaviors, methods after the channel surface:

```ts
  /** Recorded Cast-UI calls (Phase 6.1). Dialog/expanded are argless → counts. */
  showCastDialogCalls = 0
  showExpandedControlsCalls = 0
  readonly showIntroductoryOverlayCalls: boolean[] = []
```

```ts
  /** Scriptable Cast-UI behaviour (default: "shown" → resolve `true`). */
  showCastDialogBehavior: () => Promise<boolean> = async () => true
  showExpandedControlsBehavior: () => Promise<boolean> = async () => true
  showIntroductoryOverlayBehavior: (once: boolean) => Promise<boolean> =
    async () => true
```

```ts
  // --- Cast UI surface (Phase 6.1) ---

  async showCastDialog(): Promise<boolean> {
    this.showCastDialogCalls++
    return this.showCastDialogBehavior()
  }

  async showExpandedControls(): Promise<boolean> {
    this.showExpandedControlsCalls++
    return this.showExpandedControlsBehavior()
  }

  async showIntroductoryOverlay(once: boolean): Promise<boolean> {
    this.showIntroductoryOverlayCalls.push(once)
    return this.showIntroductoryOverlayBehavior(once)
  }
```

- [ ] **Step 6: `src/specs/CastButton.nitro.ts`** (new — the repo's first HybridView):

```ts
import type {
  HybridView,
  HybridViewProps,
  HybridViewMethods,
} from 'react-native-nitro-modules'

/**
 * Nitro view spec for the Cast button (GCKUICastButton / MediaRouteButton).
 *
 * `tintColor` crosses the bridge as a processed AARRGGBB color int (the output
 * of RN's `processColor`) — the React wrapper in `components/CastButton.tsx`
 * converts from `ColorValue` and always includes the key (`?? null`) so a
 * removed prop resets the native default instead of stranding the old tint
 * (E11 — nitrogen's prop parser keeps the cached value for absent keys).
 */
export interface CastButtonProps extends HybridViewProps {
  tintColor?: number
}

export interface CastButtonMethods extends HybridViewMethods {}

export type CastButton = HybridView<CastButtonProps, CastButtonMethods>
```

- [ ] **Step 7: `nitro.json`** — add to `autolinking` (required for views; nitrogen's view codegen throws without it):

```json
    "CastButton": {
      "ios": {
        "language": "swift",
        "implementationClassName": "HybridCastButton"
      },
      "android": {
        "language": "kotlin",
        "implementationClassName": "HybridCastButton"
      }
    }
```

- [ ] **Step 8: Regenerate + eyeball the first-view glue**

```bash
yarn specs
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git status --short nitrogen/
```

Eyeball the `nitrogen/generated/**` diff for: the shared `CastButtonConfig.json` view config (note its exact path — the TS lane imports it), the C++ ComponentDescriptor/ShadowNode files, the iOS `HybridCastButtonComponent.mm` (self-registers via `+load` → `RCTComponentViewFactory` — no manual iOS registration needed), the Kotlin `HybridCastButtonManager` (must later be returned from `NitroGoogleCastPackage.createViewManagers` — E1, Task 7), and podspec/gradle glue changes.

- [ ] **Step 9: Commit + push the barrier (inline on `v5`)**

```bash
git add src/ nitro.json nitrogen/
git commit -m "feat(v5): Phase 6 T1a — Cast UI transport surface + CastButton view spec (barrier) (v5-8hq.2)

show* one-shots (boolean = call issued; E7 contract) on all 3 drift surfaces
+ generic mutate<T> adapter + web resolve-false stubs + fake records/behaviors.
First HybridView: CastButton.nitro.ts (tintColor as processed color int) +
required nitro.json autolinking entry. Nitrogen regenerated; native base
intentionally incomplete until 6.1c/6.1d (T1a convention)."
git push origin v5
```

**CHECK IN with the driver before fanning out.**

---

### Task 2: 6.1b — `CastContext.show*` façade (lane B starts: `git checkout -b petrbela/p61-ts` from the barrier)

**Files:**
- Modify: `src/api/CastContext.ts`
- Test: `src/api/__tests__/castUi.test.ts` (new)

- [ ] **Step 1: failing tests** — `castUi.test.ts`, same singleton-mock pattern as `channels.test.ts`: `showCastDialog`/`showExpandedControls` delegate and pass through `true`/`false`/rejections; `showIntroductoryOverlay()` forwards `once=true` by default, `{ once: false }` forwards `false`; a scripted rejection surfaces the typed `CastError`.
- [ ] **Step 2: implement** — on `CastContext` (replace the "deferred to Phase 6" note in the class doc):

```ts
  /** Show the Cast dialog (device chooser / Android in-session controller). */
  static showCastDialog(): Promise<boolean> {
    return castTransport.showCastDialog()
  }

  /** Present the default expanded media controls. */
  static showExpandedControls(): Promise<boolean> {
    return castTransport.showExpandedControls()
  }

  /**
   * Present the introductory overlay on the current CastButton.
   * `options.once` (default `true`) shows it only once per install.
   */
  static showIntroductoryOverlay(options?: {
    once?: boolean
  }): Promise<boolean> {
    return castTransport.showIntroductoryOverlay(options?.once ?? true)
  }
```

JSDoc carries the E7 honest-boolean wording + the E8 Android manifest note.
- [ ] **Step 3:** `yarn typescript && yarn test castUi` → commit `feat(v5): CastContext.show* Cast UI methods (v5-8hq.3)`.

---

### Task 3: 6.1b — Hooks (`useCastState` / `useDevices` / `useCastSession` / `useCastDevice`)

**Files:**
- Create: `src/api/useCastState.ts`, `src/api/useDevices.ts`, `src/api/useCastSession.ts`, `src/api/useCastDevice.ts`
- Test: `src/api/__tests__/uiHooks.test.tsx` (react-test-renderer Probe pattern from `useCastChannel.test.tsx`)

- [ ] **Step 1: failing tests** covering: `useCastState` re-renders on `emitState`; `useDevices` re-renders on `emitDevices` and is ref-stable otherwise; `useCastDevice` device ↔ `null` across lifecycle and honors `ignoreSessionUpdatesInBackground` (E6); `useCastSession` — session on `started`, `null` on `ended`, `null` on `suspended` by default, retained (same reference) on `suspended` with the option, **fresh reference** on `resumed` (assert `not.toBe`), option flip re-subscribes.
- [ ] **Step 2: implement.**
  - `useCastState(): CastState` — `useSyncExternalStore(castStore.subscribe, () => castStore.getSnapshot().castState)`. JSDoc notes the migration nuance (v4 returned `null` pre-init; v5 reports the seeded state).
  - `useDevices(): readonly Device[]` — same pattern over `snapshot.devices`.
  - `useCastSession(options?: { ignoreSessionUpdatesInBackground?: boolean }): CastSession | null` — **two internal paths (E4/E5)**: without the option, plain `useSyncExternalStore(castStore.subscribe, () => CastContext.getSessionManager().getCurrentCastSession())` (memoized per generation ⇒ ref-stable, race-free). With the option, `useState` + SessionManager events (`started`/`resumed`/`ended`/`startFailed`/`resumeFailed`; `suspended` deliberately not nulling), and the effect **subscribes first, then re-reads** `getCurrentCastSession()` synchronously to close the seed→subscribe gap. JSDoc: the retained façade is inert while suspended (mutations reject `noSession`, same as v4 natively); `resumed` always yields a fresh generation-bound reference — key effects on `castSession?.id`.
  - `useCastDevice(options?): Device | null` — delegates: reads `useCastSession(options)` and returns its device (v4 parity, E6). (Device identity is frozen per session ⇒ ref-stable.)
- [ ] **Step 3:** full verification → commit `feat(v5): useCastState/useCastSession/useCastDevice/useDevices hooks (v5-8hq.3)`.

---

### Task 4: 6.1b — `CastButton` React component

**Files:**
- Create: `src/components/CastButton.tsx`, `src/components/CastButton.web.tsx` (E3)
- Test: `src/components/__tests__/CastButton.test.tsx`

- [ ] **Step 1: failing test** — `jest.mock('react-native-nitro-modules', …)` stubbing `getHostComponent` to return a recording component (the real one deep-imports `NativeComponentRegistry`, which jest/web can't provide); assert: renders, string `tintColor` arrives as the `processColor` int, absent `tintColor` passes `null` (E11), `style`/ViewProps pass through.
- [ ] **Step 2: implement `CastButton.tsx`:**

```tsx
import { processColor, type ColorValue, type ViewProps } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import type {
  CastButtonProps as NativeCastButtonProps,
  CastButtonMethods,
} from '../specs/CastButton.nitro'
import CastButtonConfig from '../../nitrogen/generated/shared/json/CastButtonConfig.json'

export interface CastButtonProps extends ViewProps {
  /** Tint color of the Cast icon (any RN ColorValue). Omit for the platform default. */
  tintColor?: ColorValue
}

const NativeCastButton = getHostComponent<
  NativeCastButtonProps,
  CastButtonMethods
>('CastButton', () => CastButtonConfig)

/**
 * Button that presents the Cast icon; pressing it opens the native Cast
 * dialog. Keeping one mounted also anchors `showIntroductoryOverlay` and (on
 * Android) triggers GCK's ACTIVE device scan.
 */
export function CastButton({ tintColor, ...props }: CastButtonProps) {
  // Always include the key: an absent prop would strand the previous tint in
  // the generated prop parser (E11); an explicit null resets the default.
  const processed = tintColor != null ? processColor(tintColor) : null
  return (
    <NativeCastButton
      {...props}
      tintColor={typeof processed === 'number' ? processed : null}
    />
  )
}
```

  **Path check:** confirm the generated config path recorded in Task 1 Step 8 (adjust the import if nitrogen emitted it elsewhere under `nitrogen/generated/shared/`). The source-relative import is correct for metro consumers (`"react-native": "src/index"`); add a jest drift test asserting the imported JSON's `validAttributes` covers exactly `tintColor` + `hybridRef` so a spec/regen drift fails the suite.
  `CastButton.web.tsx`: same props type, returns `null` (web transport is a stub until Phase 8).
- [ ] **Step 3:** full verification → commit `feat(v5): CastButton component (Nitro view wrapper) (v5-8hq.3)`.

---

### Task 5: 6.1b — Exports + docs

**Files:**
- Modify: `src/index.ts` — export `CastButton` + `CastButtonProps`, the 4 hooks, `UseCastSessionOptions`.
- Update docs: `docs/components/CastButton.md` (v5 usage, tintColor, overlay anchor role), `docs/components/ExpandedController.md` (v5: `showExpandedControls`, `NitroExpandedControllerActivity` manifest registration until 6.2), `docs/guides/hooks.md` (4 new hooks), `docs/guides/migrating-v4-to-v5.md` (show* boolean contract E7; dialog-without-button improvement; overlay `false`-instead-of-hang fix + platform-local once-flags E2; `useCastSession` suspend/resume notes E5; `useCastState` init-window note).

- [ ] Full verification (`yarn typescript && yarn test && prettier`) → commit `docs(v5): CastButton + Cast UI + hooks docs (v5-8hq.3)`. Push `petrbela/p61-ts`.

---

### Task 6: 6.1c — iOS (bead `v5-8hq.4`, branch `petrbela/p61-ios`, `ios/` only)

**Files:**
- Create: `ios/NitroGoogleCast/HybridCastButton.swift`, `ios/NitroGoogleCast/CastButtonRegistry.swift`, `ios/NitroGoogleCast/CastButtonHostView.swift`
- Modify: `ios/NitroGoogleCast/HybridCastTransport.swift` (3 show* impls)

- [ ] **Step 1: `CastButtonHostView.swift`** — a `UIView` subclass that owns one `GCKUICastButton` (created once in `init`, pinned to bounds — fixes the v4 recreate-on-`layoutSubviews` bug) and calls `onWindowChanged` from `didMoveToWindow` (the E10 attach hook).
- [ ] **Step 2: `CastButtonRegistry.swift`** — main-thread-only, ordered array of weak button entries. `register`/`unregister` driven by attach/detach (window changes); `current` = last entry whose button is in a window and `!isHidden`, else `nil`.
- [ ] **Step 3: `HybridCastButton.swift`** — implements the generated view spec (`view` returns the host view). `tintColor: Double?` setter → `UIColor(argb:)` conversion (nil → restore default tint). `prepareForRecycle` unregisters + resets tint (E10); `memorySize` small constant.
- [ ] **Step 4: transport show\* impls** — all `DispatchQueue.main.async`, `[weak self]`, re-resolve `GCKCastContext.sharedInstance()` per call:
  - `showCastDialog` → `presentCastDialog()`, resolve `true`.
  - `showExpandedControls` → `presentDefaultExpandedMediaControls()`, resolve `true`.
  - `showIntroductoryOverlay(once)` → `if !once { clearCastInstructionsShownFlag() }`; `guard let button = CastButtonRegistry.current else { resolve(false) }`; resolve the `Bool` from `presentCastInstructionsViewControllerOnce(with: button)` (verify the exact bridged Swift name against the Pods header `GCKCastContext+UI.h`).
- [ ] **Step 5: compile gate** (`pod install` in `example/ios` first — nitrogen output changed), commit `feat(v5): iOS CastButton view + Cast UI dialogs (v5-8hq.4)`, push.

---

### Task 7: 6.1d — Android (bead `v5-8hq.5`, branch `petrbela/p61-android`, `android/` only)

**Files:**
- Create: `android/src/main/java/com/margelo/nitro/googlecast/HybridCastButton.kt`, `CastButtonRegistry.kt`, `NitroExpandedControllerActivity.kt`, `android/src/main/res/menu/cast_expanded_controller_menu.xml`
- Modify: `HybridCastTransport.kt` (3 show* impls + overlay pref), `NitroGoogleCastPackage.kt` (**E1**)

- [ ] **Step 1: `HybridCastButton.kt`** — constructed with the `ThemedReactContext` the generated `HybridCastButtonManager` passes in. v4 dance verbatim: `ContextThemeWrapper(context, androidx.mediarouter.R.style.Theme_MediaRouter)` → obtain `externalRouteEnabledDrawable` → `setRemoteIndicatorDrawable` **before** `CastButtonFactory.setUpMediaRouteButton` (try/catch like v4); tint via `DrawableCompat` re-applied on drawable/prop change (null prop → clear tint). Registry register/unregister via `addOnAttachStateChangeListener` + `onDropView` (E10).
- [ ] **Step 2: `CastButtonRegistry.kt`** — mirror of iOS: weak refs, attach-order, `current` requires attached + `visibility == VISIBLE`. Exists only for the overlay anchor.
- [ ] **Step 3: `NitroGoogleCastPackage.kt` (E1, P1)** — `createViewManagers` returns `listOf(HybridCastButtonManager())` (package `com.margelo.nitro.googlecast.views`); rewrite the stale "no view managers" doc comment.
- [ ] **Step 4: transport show\* impls** — main thread, re-resolve `CastContext.getSharedInstance(...)` + current Activity per call; no/finishing Activity → resolve `false`:
  - `showCastDialog` (E9) — activity must be a `FragmentActivity` (ReactActivity is); session exists (`castContext.sessionManager.currentCastSession != null`, covers `connecting`) → `MediaRouteControllerDialogFragment`, else `MediaRouteChooserDialogFragment` with `routeSelector = castContext.mergedSelector`; `show(supportFragmentManager, tag)`, resolve `true`.
  - `showExpandedControls` (E8) — `Intent(context, NitroExpandedControllerActivity::class.java)` + `FLAG_ACTIVITY_NEW_TASK`; catch `ActivityNotFoundException` → reject `CastError` `notSupported` with a register-in-manifest message; else resolve `true`.
  - `showIntroductoryOverlay(once)` (E2) — own SharedPreferences flag (e.g. key `nitro_googlecast_intro_overlay_shown`), **never `setSingleTime()`**: `once && flag` → resolve `false`; no visible registry button → resolve `false`; else `IntroductoryOverlay.Builder(activity, button)` + `setOnOverlayDismissedListener { setFlag(); resolve(true) }` + `show()`. Every path settles — both v4 hangs (no button; already-shown) are dead.
- [ ] **Step 5: `NitroExpandedControllerActivity.kt` + menu xml** — v4 port: extends GCK `ExpandedControllerActivity`, inflates `cast_expanded_controller_menu`, `CastButtonFactory.setUpMediaRouteButton(this, menu, R.id.media_route_menu_item)`.
- [ ] **Step 6: compile gate** `compileDebugKotlin`, commit `feat(v5): Android CastButton view + Cast UI dialogs + expanded controller (v5-8hq.5)`, push.

---

### Task 8: Assemble, review, PR, device pass (bead `v5-8hq.6`)

- [ ] **Step 1: integration branch** from the Task 1 barrier commit:

```bash
git checkout v5 && git checkout -b petrbela/phase6.1
git merge --no-ff origin/petrbela/p61-ts
git merge --no-ff origin/petrbela/p61-ios
git merge --no-ff origin/petrbela/p61-android
```

- [ ] **Step 2: example wiring** — `example/App.tsx`: `<CastButton tintColor=… />` in the header row + three buttons calling the `show*` methods (log resolution/rejection into the event log); register the expanded controller in `example/android/app/src/main/AndroidManifest.xml`:

```xml
<activity
  android:name="com.margelo.nitro.googlecast.NitroExpandedControllerActivity"
  android:exported="false"
  android:theme="@style/Theme.AppCompat.NoActionBar" />
```

- [ ] **Step 3: combined verification** — jest/tsc/prettier + both native compile gates (after `pod install`).
- [ ] **Step 4: two-stage subagent review** (harness Agent tool):
  - iOS diff reviewer (`git diff <barrier>..HEAD -- ios/`): one-button-per-view, registry weak/attach discipline (E10), main-thread + `[weak self]`, overlay BOOL path, Invariant 1;
  - Android diff reviewer (`-- android/`): E1 ViewManager registration present, drawable-before-setup order, DialogFragment usage (E9), overlay own-flag every-path-settles (E2), `ActivityNotFoundException` reject (E8), Invariant 1, main-thread discipline;
  - holistic reviewer (full diff): drift surfaces aligned, E-amendments all landed, docs match behavior, no state slipped into the store.
  Fix findings; re-run verification.
- [ ] **Step 5: PR to `v5`** (`gh pr create --base v5 --title "feat(v5): Phase 6 Slice 6.1 — CastButton + Cast UI (v5-8hq.2/.3/.4/.5)"`). Native CI is the authoritative gate. **Squash-merge requires explicit driver approval.**
- [ ] **Step 6: device pass** (real hardware; Android priority — emulators can't discover Cast):
  - Android: CastButton renders + triggers ACTIVE scan → real Chromecast appears (closes the emulator gap); chooser via button AND via `showCastDialog` with no button mounted; controller dialog while connected; overlay shows → dismiss → `once` re-call resolves `false`; no-button overlay resolves `false`; expanded controls activity.
  - iOS: dialog / overlay (incl. `once=false` re-show) / expanded controls parity.
  - **Fold in `v5-vlv` item 4**: CastChannel registration-time handshake delivery; spot-check any remaining P5 device-gated items.
- [ ] **Step 7:** `bd close v5-8hq.2 v5-8hq.3 v5-8hq.4 v5-8hq.5 v5-8hq.6` (+ update `v5-vlv`).

---

## Failure-mode coverage (every row must hold after Task 8)

| Codepath | Handling | Covered by |
|----------|----------|------------|
| `showCastDialog` with no Activity / finishing Activity (Android) | resolve `false` | Task 7 code; device pass |
| `showExpandedControls`, activity unregistered in manifest | typed `notSupported` reject w/ manifest hint (E8) | castUi.test.ts (rejection passthrough) + Task 7 code |
| overlay with no visible button | resolve `false` (fixes v4 hang #1) | Task 7/6 code; device pass |
| overlay already shown + `once` (Android) | own-flag → immediate `false` (fixes v4 hang #2, E2) | Task 7 code; device pass |
| overlay promise settlement | every path resolves (no `setSingleTime`) | Task 7 code review checklist |
| CastButton on Android renders "unimplemented component" | `createViewManagers` returns the generated manager (E1) | Task 7 + holistic review; device pass |
| CastButton import breaks web bundle | `CastButton.web.tsx` renders null (E3) | Task 4 file split |
| tintColor removed → stale tint | wrapper always passes key, null resets (E11) | CastButton.test.tsx |
| session event between hook render and effect subscribe | default path uses `useSyncExternalStore`; option path subscribes-then-rereads (E4) | uiHooks.test.tsx |
| suspended session with `ignoreSessionUpdatesInBackground` | retained inert façade, documented; mutations reject `noSession` (E5) | uiHooks.test.tsx + JSDoc |
| dialog across rotation (Android) | DialogFragments, lifecycle-managed (E9) | Task 7 code; device pass |
| generated config JSON drifts from spec | jest drift test on `validAttributes` | CastButton.test.tsx |

**Device-gated (real Chromecast, post-merge):** ACTIVE-scan discovery, all dialogs/overlay/expanded UI flows, `v5-vlv` item 4.

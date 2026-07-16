# Cast setup, notifications & expanded-controller customization (Phase 6 Slice 6.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the consumer-setup slice — library `NitroCastOptionsProvider` (v4-parity notification actions + image selection), library-manifest `NitroExpandedControllerActivity` (auto-registered, overridable theme), a default image picker on both platforms (iOS's first, via `GCKCastContext.imagePicker`), `CastContext.showPlayServicesErrorDialog()`, the Expo config-plugin v5 rewrite, and the docs sweep.

**Architecture:** one barrier (Task 1) lands the `showPlayServicesErrorDialog` transport surface + the shared heuristic vector fixture inline on `v5`; then three disjoint lanes fan out — TS/plugin/docs (Tasks 2–5), iOS (Task 6), Android (Task 7) — and Task 8 assembles. No new state slices, no StoreEvents, no `initAndSubscribe` signature change (iOS adds a picker install *inside* its existing main-queue hop).

**Tech Stack:** TypeScript + Nitro 0.35.10, jest + `FakeCastTransport` + @expo/config-plugins fixtures, Swift/GCK 4.8.4 (iOS, XCTest), Kotlin/play-services-cast-framework 22.0.0 (Android, JUnit + Robolectric 4.13).

**Spec:** `docs/superpowers/specs/2026-07-12-cast-setup-notifications-design.md` — **including the E1–E11 eng-review amendments, which are folded into every task below.**

**Verification commands (used throughout):**

```bash
yarn typescript                      # tsc --noEmit
yarn test                            # jest (façade + plugin suites)
npx prettier --check "src/**/*.ts" "src/**/*.tsx"
yarn specs                           # nitrogen codegen (NOT `yarn nitrogen`)

# Android gate (from example/android) — compile AND unit tests (7A):
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew :react-native-google-cast:compileDebugKotlin :react-native-google-cast:testDebugUnitTest

# iOS gates (after `pod install` in example/ios — nitrogen output changed):
xcodebuild -project example/ios/Pods/Pods.xcodeproj -target NitroGoogleCast \
  -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
xcodebuild test -workspace example/ios/CastExample.xcworkspace \
  -scheme NitroGoogleCastTests -destination 'platform=iOS Simulator,name=iPhone 17' \
  CODE_SIGNING_ALLOWED=NO                # 7A — adjust simulator name to what's installed
```

**Parallelization:** Task 1 is the barrier (inline on `v5`, pushed; **CHECK IN with the driver before fanning out**). Tasks 2–5 = lane B (`petrbela/p62-ts`, `src/` + `docs/`), Task 6 = lane C (`petrbela/p62-ios`, `ios/` + `example/ios/NitroGoogleCastTests/`), Task 7 = lane D (`petrbela/p62-android`, `android/`) — all three branch from the Task 1 commit; disjoint dirs ⇒ no contention (`fixtures/cast-options/` ships in the barrier so both native lanes can read it). Task 8 assembles on `petrbela/phase6.2` (`example/android`, `example/App.tsx` are integrate-owned).

**Beads:** `v5-9yc.1` closed (design). Tag commits: barrier `v5-9yc.2`, TS `v5-9yc.3`, iOS `v5-9yc.4`, Android `v5-9yc.5`, integration `v5-9yc.6`.

---

### Task 1: 6.2a — Transport surface + heuristic vectors (BARRIER, bead `v5-9yc.2`)

Lands inline on `v5`. After this task: `yarn typescript` + `yarn test` + prettier green; **native intentionally does not compile** until Tasks 6/7 (T1a convention — PR CI is the authoritative native gate).

**Files:**
- Modify: `src/transport/types.ts`, `src/specs/CastTransport.nitro.ts`, `src/transport/CastTransport.ts`, `src/transport/CastTransport.web.ts`, `src/transport/__fakes__/FakeCastTransport.ts`
- Create: `fixtures/cast-options/heuristics.json` (E3)
- Regenerate: `nitrogen/generated/**` via `yarn specs`

- [ ] **Step 1: `src/transport/types.ts`** — add after the Cast-UI section:

```ts
  // --- Cast setup / diagnostics UI (Phase 6.2) ---

  /**
   * Present the Google Play Services error-resolution dialog for `errorCode`
   * (a ConnectionResult value — the façade converts from PlayServicesState).
   * `true` = the dialog was shown (GoogleApiAvailability's own boolean). The
   * graceful can't-show cases resolve `false`: no current Activity, a code
   * needing no dialog (`success`), or a non-Android platform (contract ii /
   * 8A). Genuine native failures reject a typed CastError via the adapter.
   */
  showPlayServicesErrorDialog(errorCode: number): Promise<boolean>
```

- [ ] **Step 2: `src/specs/CastTransport.nitro.ts`** — mirror:

```ts
  // Cast setup / diagnostics UI (Phase 6.2) — mirrors `CastTransportApi`.
  showPlayServicesErrorDialog(errorCode: number): Promise<boolean>
```

(`errorCode` is not a C++ reserved word — safe as a nitrogen param name.)

- [ ] **Step 3: `src/transport/CastTransport.ts`** — after the Cast-UI one-shots:

```ts
  // Play Services diagnostics dialog — same error-translation wrapper.
  showPlayServicesErrorDialog: (errorCode) =>
    mutate(() => hybrid.showPlayServicesErrorDialog(errorCode)),
```

- [ ] **Step 4: `src/transport/CastTransport.web.ts`** — reuse `neverShown`:

```ts
  showPlayServicesErrorDialog: neverShown,
```

- [ ] **Step 5: `FakeCastTransport.ts`** — records/behavior/method in the established sections:

```ts
  /** Recorded Play-Services-dialog calls (Phase 6.2): the errorCode values. */
  readonly showPlayServicesErrorDialogCalls: number[] = []
```

```ts
  showPlayServicesErrorDialogBehavior: (errorCode: number) => Promise<boolean> =
    async () => true
```

```ts
  async showPlayServicesErrorDialog(errorCode: number): Promise<boolean> {
    this.showPlayServicesErrorDialogCalls.push(errorCode)
    return this.showPlayServicesErrorDialogBehavior(errorCode)
  }
```

- [ ] **Step 6: `fixtures/cast-options/heuristics.json`** (E3 — the cross-platform contract; loaders map symbolic surfaces to platform constants and **skip surfaces their platform can't represent**):

```json
{
  "comment": "v4-parity heuristics (design 2026-07-12, E1/E3). surfaces: castDialog=Android IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND / iOS .castDialog; background=Android IMAGE_TYPE_EXPANDED_CONTROLLER_BACKGROUND / iOS .background; miniController=Android IMAGE_TYPE_MINI_CONTROLLER_THUMBNAIL / iOS .miniController; notificationThumbnail,lockScreenBackground=Android-only; custom=iOS-only.",
  "pickImage": [
    { "surface": "castDialog", "imageCount": 0, "expectedIndex": null },
    { "surface": "background", "imageCount": 0, "expectedIndex": null },
    { "surface": "castDialog", "imageCount": 1, "expectedIndex": 0 },
    { "surface": "background", "imageCount": 1, "expectedIndex": 0 },
    { "surface": "castDialog", "imageCount": 2, "expectedIndex": 0 },
    { "surface": "castDialog", "imageCount": 3, "expectedIndex": 0 },
    { "surface": "background", "imageCount": 2, "expectedIndex": 1 },
    { "surface": "miniController", "imageCount": 2, "expectedIndex": 1 },
    { "surface": "notificationThumbnail", "imageCount": 2, "expectedIndex": 1 },
    { "surface": "lockScreenBackground", "imageCount": 2, "expectedIndex": 1 },
    { "surface": "custom", "imageCount": 2, "expectedIndex": 1 }
  ],
  "notificationActions": [
    { "queueItemCount": 0, "mediaType": "generic",
      "actions": ["REWIND", "TOGGLE_PLAYBACK", "FORWARD", "STOP_CASTING"],
      "compactViewIndices": [1, 3] },
    { "queueItemCount": 1, "mediaType": "movie",
      "actions": ["REWIND", "TOGGLE_PLAYBACK", "FORWARD", "STOP_CASTING"],
      "compactViewIndices": [1, 3] },
    { "queueItemCount": 0, "mediaType": null,
      "actions": ["REWIND", "TOGGLE_PLAYBACK", "FORWARD", "STOP_CASTING"],
      "compactViewIndices": [1, 3] },
    { "queueItemCount": 2, "mediaType": "movie",
      "actions": ["SKIP_PREV", "TOGGLE_PLAYBACK", "SKIP_NEXT", "STOP_CASTING"],
      "compactViewIndices": [1, 2] },
    { "queueItemCount": 5, "mediaType": "photo",
      "actions": ["SKIP_PREV", "TOGGLE_PLAYBACK", "SKIP_NEXT", "STOP_CASTING"],
      "compactViewIndices": [1, 2] },
    { "queueItemCount": 1, "mediaType": "photo",
      "actions": ["TOGGLE_PLAYBACK", "STOP_CASTING"],
      "compactViewIndices": [0, 1] }
  ]
}
```

(Notes: queue wins over photo when `queueItemCount > 1` — v4 checked `hasQueue()` first. `actions` are symbolic `MediaIntentReceiver.ACTION_*` suffixes; Android maps to the constants, iOS's notification heuristic doesn't exist (Android-only surface) so its loader only consumes `pickImage`.)

- [ ] **Step 7: regen + verify + commit + push (inline on `v5`)**

```bash
yarn specs
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/ fixtures/ nitrogen/
git commit -m "feat(v5): Phase 6.2 barrier — showPlayServicesErrorDialog transport surface + heuristic vectors (v5-9yc.2)

showPlayServicesErrorDialog(errorCode) on all drift surfaces (types, nitro
spec, adapter mutate<T>, web neverShown, fake records/behavior) + nitrogen
regen. fixtures/cast-options/heuristics.json pins the v4-parity picker +
notification-action branches for both native lanes (E3; iOS first-image
branch keys on castDialog per E1). Native intentionally incomplete until
6.2c/6.2d (T1a convention)."
git push origin v5
```

**CHECK IN with the driver before fanning out.**

---

### Task 2: 6.2b — `CastContext.showPlayServicesErrorDialog` façade (lane B starts: `git checkout -b petrbela/p62-ts` from the barrier)

**Files:**
- Modify: `src/api/CastContext.ts`
- Test: `src/api/__tests__/castUi.test.ts` (extend)

- [ ] **Step 1: failing tests** — extend `castUi.test.ts`: every `PlayServicesState` converts to its pinned code (`success 0 · missing 1 · updateRequired 2 · disabled 3 · invalid 9 · updating 18` — assert via `fake.showPlayServicesErrorDialogCalls`); resolution (`true`/`false`) passes through; a scripted rejection surfaces the typed `CastError`.
- [ ] **Step 2: implement** — in `src/api/CastContext.ts`:

```ts
/**
 * PlayServicesState → ConnectionResult code, for the Play Services error
 * dialog. Pinned to the Android converter's value map (contract ii) — the
 * exact reverse of `playServicesStateFromConnectionResult`.
 */
const PLAY_SERVICES_ERROR_CODE: Record<PlayServicesState, number> = {
  success: 0,
  missing: 1,
  updateRequired: 2,
  disabled: 3,
  invalid: 9,
  updating: 18,
}
```

```ts
  /**
   * Show a dialog with a localized message about the error state. Upon user
   * confirmation the dialog directs them to the Play Store if Google Play
   * services is out of date or missing, or to system settings if it's
   * disabled on the device.
   *
   * @platform android — resolves `false` on iOS and web (8A).
   * @param playServicesState state returned from
   * {@link CastContext.getPlayServicesState}. If it's `success`, the dialog
   * is not shown and the promise resolves `false`.
   */
  static showPlayServicesErrorDialog(
    playServicesState: PlayServicesState
  ): Promise<boolean> {
    return castTransport.showPlayServicesErrorDialog(
      PLAY_SERVICES_ERROR_CODE[playServicesState]
    )
  }
```

- [ ] **Step 3:** `yarn typescript && yarn test castUi` → commit `feat(v5): CastContext.showPlayServicesErrorDialog (v5-9yc.3)`.

---

### Task 3: 6.2b — Expo plugin: Android rewrite

**Files:**
- Modify: `src/plugin/withAndroidGoogleCast.ts`, `src/plugin/withGoogleCast.ts`
- Test: `src/plugin/__tests__/withAndroidGoogleCast-test.ts` (new) + fixtures (v4-shaped manifest/MainActivity/gradle inputs)

- [ ] **Step 1: failing tests (CRITICAL regression suite)** — on fixture inputs assert:
  - v5 emissions: `OPTIONS_PROVIDER_CLASS_NAME` = `com.margelo.nitro.googlecast.NitroCastOptionsProvider` by default; `androidOptionsProvider` prop overrides it (2A); receiver meta-data key is `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID`; `androidNotificationsEnabled: false` writes `com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED` = `"false"`, absent otherwise; gradle `castFrameworkVersion` + dependency emissions unchanged.
  - v4-absence: output contains **no** `com.reactnative.googlecast.GoogleCastOptionsProvider`, no `RNGCExpandedControllerActivity`, no `<activity>` addition at all, and MainActivity is **byte-identical** to input (no `RNGCCastContext`, no import, no tagged block).
  - **E6 residue removal**: given v4-plugin-shaped inputs (old receiver meta-data key, `RNGCExpandedControllerActivity` activity, MainActivity with the v4 `react-native-google-cast-onCreate` tagged block + `import com.reactnative.googlecast.api.RNGCCastContext`), the v5 plugin removes all of them.
  - **E4 idempotency**: running the mods twice yields single meta-data entries and single tagged gradle blocks (deep-equal to the single-run output).
  - **E8 floor warning**: `androidPlayServicesCastFrameworkVersion: '21.2.0'` triggers a `console.warn` mentioning 21.3.0 and #447/#527 (spy on `console.warn`); `'22.1.0'`, `'+'`, and unset do not.
- [ ] **Step 2: implement** — rewrite `withAndroidGoogleCast.ts`:
  - constants: `META_PROVIDER_CLASS` (unchanged SDK key), `META_RECEIVER_APP_ID = 'com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID'`, `META_NOTIFICATIONS_ENABLED = 'com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED'`, `DEFAULT_OPTIONS_PROVIDER = 'com.margelo.nitro.googlecast.NitroCastOptionsProvider'`, v4 identifiers for removal (E6).
  - manifest mod: remove v4 residue (filter old meta-data by name, filter `RNGCExpandedControllerActivity` activities) then upsert the v5 meta-data. **No activity add, no MainActivity mod** — delete `withMainActivityLazyLoading` and instead add a `withMainActivity` cleanup mod that only strips the v4 tagged block (`removeContents({ tag: 'react-native-google-cast-onCreate' })`) and the exact v4 import line, leaving everything else untouched (no-op on clean templates).
  - keep `withProjectBuildGradleVersion` / `withAppBuildGradleImport` / `safeExtGet` as-is (Groovy-only + clear error).
  - floor warning (E8): `parseCafVersion(version)` — strict `^\d+\.\d+\.\d+$` parse; when parseable and `< 21.3.0`, `console.warn` citing #447/#527 + the FGS permissions pre-21.3.0 pins need.
  - `withGoogleCast.ts`: add `androidOptionsProvider?: string`, `androidNotificationsEnabled?: boolean` (JSDoc: both are meta-data consumed by `NitroCastOptionsProvider` or subclasses that call `super` — a from-scratch provider ignores them, E7), pass through; `expandedController` JSDoc now "iOS-only effect (Android is automatic in v5)".
- [ ] **Step 3:** `yarn test plugin` → commit `feat(v5): Expo plugin Android v5 rewrite — NitroCastOptionsProvider wiring, v4 residue removal, CAF floor warning (v5-9yc.3)`.

---

### Task 4: 6.2b — Expo plugin: iOS refresh (contract v + E10)

**Files:**
- Modify: `src/plugin/withIosGoogleCast.ts`, `src/plugin/withGoogleCast.ts`
- Test: `src/plugin/__tests__/withIosGoogleCast-test.ts` (extend) + new `AppDelegate.swift` fixture (copy of `example/ios/CastExample/AppDelegate.swift` **minus** its manual GCK init + import)

- [ ] **Step 1: failing tests** — Swift RN 0.86 fixture snapshot (init injected before `let delegate = ReactNativeDelegate()`, import added); objc fixture still green; double-run = single tagged block (idempotency); **conflict**: a fixture whose AppDelegate contains `GCKCastContext.setSharedInstanceWith` outside the tagged block → throws an error naming the file, the conflict, and the `iosSkipAppDelegateInit` escape hatch (E10); **anchor miss**: an unrecognized AppDelegate shape → throws naming the expected anchor + manual-setup docs link; **skip prop**: `iosSkipAppDelegateInit: true` leaves the AppDelegate byte-identical while Info.plist mods still apply.
- [ ] **Step 2: implement** —
  - conflict check (runs before merge, both languages): strip the existing tagged block first (`removeContents`), then if the remainder matches `/GCKCastContext[\s.]*(setSharedInstanceWith|sharedInstanceWithOptions)/`, throw the descriptive error (contract v).
  - anchor miss: wrap `mergeContents` and rethrow with the descriptive message when the anchor regex found no match.
  - `iosSkipAppDelegateInit?: boolean` (default `false`) in `withGoogleCast.ts` + `withIosGoogleCast.ts`: when true, skip `withIosAppDelegateLoaded` entirely (Info.plist wiring unaffected).
- [ ] **Step 3:** `yarn test plugin` → commit `feat(v5): Expo plugin iOS — RN 0.86 Swift fixture, conflict/anchor errors, iosSkipAppDelegateInit (v5-9yc.3)`.

---

### Task 5: 6.2b — Docs sweep

**Files:** `docs/getting-started/setup.md`, `docs/getting-started/installation.md`, `docs/getting-started/troubleshooting.md` (E11b), `docs/guides/notifications.md` (new), `docs/components/ExpandedController.md`, `docs/guides/customize-ui.md`, `docs/guides/migrating-v4-to-v5.md`

- [ ] `setup.md` — Expo prop table refresh (new props incl. `androidOptionsProvider`, `androidNotificationsEnabled`, `iosSkipAppDelegateInit`); bare-RN Android recipe (contract iv meta-data XML); custom-provider recipe: subclass `NitroCastOptionsProvider` overriding exactly one seam (`getReceiverApplicationId` / `getNotificationOptions` / `getImagePicker` — E7) or a from-scratch `OptionsProvider` + `androidOptionsProvider` prop; **props-interplay paragraph** (E7) + custom-provider R8 keep-rule note (E5).
- [ ] `notifications.md` (new) — Android behavior + default-actions table (Decision 4); disabling (prop / meta-data); `POST_NOTIFICATIONS` (API 33+) guidance; CAF ≥21.3.0 floor + #447/#527 citations (vi); **iOS: notifications/lock-screen are Android-only** per Google's sender design checklist — no iOS surface; `MPNowPlayingInfoCenter` explicitly out of scope.
- [ ] `ExpandedController.md` — registration is automatic; **remove any manual `<activity>` from 6.1** (1A); theme-override recipe (redefine `NitroCastExpandedController` in app resources).
- [ ] `customize-ui.md` — image-picker defaults (both platforms, v4-parity table) + override recipes (iOS: set `GCKCastContext.sharedInstance().imagePicker` in AppDelegate — the library never clobbers it, contract i; Android: provider subclass).
- [ ] `troubleshooting.md` — provider-init failure logcat signature (`IllegalStateException` from `CastContext.getSharedInstance`) + meta-data checklist (contract iv).
- [ ] `migrating-v4-to-v5.md` — 6.1→6.2 manifest-merger conflict note (1A); receiver-id meta-data key rename (breaking, bare-RN); `showPlayServicesErrorDialog` iOS-false note (8A); notification/artwork defaults parity statement.
- [ ] Full verification → commit `docs(v5): setup, notifications, expanded-controller + migration docs for 6.2 (v5-9yc.3)`. Push `petrbela/p62-ts`.

---

### Task 6: 6.2c — iOS (bead `v5-9yc.4`, branch `petrbela/p62-ios`, `ios/` + `example/ios/NitroGoogleCastTests/`)

**Files:**
- Create: `ios/NitroGoogleCast/NitroImagePicker.swift`
- Modify: `ios/NitroGoogleCast/HybridCastTransport.swift`
- Test: `example/ios/NitroGoogleCastTests/NitroImagePickerTests.swift` (new; pbxproj target membership — iOS-lane-owned, no other lane touches it)

- [ ] **Step 1: `NitroImagePicker.swift`** —

```swift
import GoogleCast

/// v4-Android-parity default image picker (design §iOS, E1). Installed by the
/// transport iff the consumer hasn't set one (contract i).
final class NitroImagePicker: NSObject, GCKUIImagePicker {
  /// Pure heuristic — pinned by fixtures/cast-options/heuristics.json (E3):
  /// empty → nil; single → first; `.castDialog` (the analogue of v4-Android's
  /// IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND) → first; else second.
  static func pickImage(
    from images: [GCKImage], imageType: GCKMediaMetadataImageType
  ) -> GCKImage? {
    guard let first = images.first else { return nil }
    if images.count == 1 || imageType == .castDialog { return first }
    return images[1]
  }

  /// Contract-i install decision, seam-tested without the singleton (E9):
  /// returns the picker to install, or nil to leave the current one alone.
  static func installIfAbsent(current: GCKUIImagePicker?) -> GCKUIImagePicker? {
    current == nil ? NitroImagePicker() : nil
  }

  func getImageWith(
    _ imageHints: GCKUIImageHints, from metadata: GCKMediaMetadata
  ) -> GCKImage? {
    Self.pickImage(
      from: metadata.images().compactMap { $0 as? GCKImage },
      imageType: imageHints.imageType)
  }
}
```

  (Selector name `getImageWith(_:from:)` is the 4.8.4 bridged form — verify against the Pods header if the compile disagrees; `image(with:from:)` is the pre-4.3.4 name.)
- [ ] **Step 2: transport** — in `initAndSubscribe`'s main-queue hop, right after `let context = GCKCastContext.sharedInstance()`:

```swift
      // Default image picker (contract i): one owner, one assignment point,
      // never clobbering a consumer-set picker (AppDelegate runs before us).
      if let picker = NitroImagePicker.installIfAbsent(current: context.imagePicker) {
        context.imagePicker = picker
      }
```

  And the new transport method (Android-only diagnostic, 8A):

```swift
  func showPlayServicesErrorDialog(errorCode: Double) throws -> Promise<Bool> {
    let promise = Promise<Bool>()
    promise.resolve(withResult: false)
    return promise
  }
```

- [ ] **Step 3: XCTests** — `NitroImagePickerTests.swift` (converter-suite pattern; XCTest build settings gotchas are already solved in this target):
  - vector-driven: load `fixtures/cast-options/heuristics.json` (path relative to `#file`, like the converter corpus), map symbolic surfaces → `GCKMediaMetadataImageType` (`castDialog`/`miniController`/`background`/`custom`; **skip** Android-only surfaces), build `GCKMediaMetadata` with N `GCKImage`s, assert `pickImage` returns the vector's `expectedIndex` image (or nil).
  - seam tests (E9, no singleton): `installIfAbsent(current: nil)` returns a `NitroImagePicker`; `installIfAbsent(current: custom)` returns nil.
  - **one** narrow singleton pin (contract i): guarded by `GCKCastContext.isSharedInstanceInitialized()` — configure once if needed, assert a never-touched context reads `imagePicker == nil`. (Do not set `imagePicker` in this test — it must stay order-independent.)
- [ ] **Step 4:** both iOS gates (build + `xcodebuild test`), commit `feat(v5): iOS default image picker + install seam + PlayServices dialog stub (v5-9yc.4)`, push.

---

### Task 7: 6.2d — Android (bead `v5-9yc.5`, branch `petrbela/p62-android`, `android/` only)

**Files:**
- Create: `android/src/main/java/com/margelo/nitro/googlecast/NitroCastOptionsProvider.kt`, `CastOptionsDefaults.kt`, `android/src/main/res/values/styles.xml`, `android/proguard-rules.pro`
- Modify: `android/src/main/AndroidManifest.xml`, `android/build.gradle` (consumerProguardFiles), `HybridCastTransport.kt`
- Test: `android/src/test/.../CastOptionsDefaultsTest.kt`, `NitroCastOptionsProviderTest.kt`

- [ ] **Step 1: manifest + theme + proguard** —
  - `AndroidManifest.xml`: the `<application><activity …NitroExpandedControllerActivity exported=false theme=@style/NitroCastExpandedController/></application>` block (design §Android; **no uses-permission** — E2/vi).
  - `styles.xml`: `<style name="NitroCastExpandedController" parent="Theme.AppCompat.NoActionBar" />`.
  - `proguard-rules.pro` (E5): keep `NitroCastOptionsProvider` + nullary ctor (reflective `OPTIONS_PROVIDER_CLASS_NAME` instantiation); wire `consumerProguardFiles 'proguard-rules.pro'` in `android/build.gradle` `defaultConfig`.
  - Update `NitroExpandedControllerActivity.kt`'s class doc (manual-registration paragraph is now stale — 1A).
- [ ] **Step 2: `CastOptionsDefaults.kt`** (internal, pure — 4A) — `NotificationActionsSpec(actions: List<String>, compactViewIndices: IntArray)`; `notificationActionsFor(queueItemCount: Int, mediaType: Int?): NotificationActionsSpec` (queue `> 1` first, then `MEDIA_TYPE_PHOTO`, else default — Decision 4); `pickImage(images: List<WebImage>, hintType: Int): WebImage?` (empty → null; single → first; `IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND` → first; else second).
- [ ] **Step 3: `NitroCastOptionsProvider.kt`** — `open class`, contract iii (reads only `Context`/`PackageManager`; **no** `CastContext.getSharedInstance` anywhere in `getCastOptions`):
  - `protected open fun getReceiverApplicationId(context)`: `NitroCastMetaData.receiverApplicationId ?: DEFAULT_MEDIA_RECEIVER_APPLICATION_ID` (blank → default, iv).
  - `protected open fun getNotificationOptions(context): NotificationOptions?` (E7): meta-data `NOTIFICATIONS_ENABLED` default `true`; disabled → `null`; enabled → `NotificationOptions.Builder().setNotificationActionsProvider(…)` where the provider shim resolves `CastContext.getSharedInstance()?.sessionManager?.currentCastSession?.remoteMediaClient?.mediaStatus` **lazily at notification-build time** and delegates to `notificationActionsFor(mediaStatus?.queueItemCount ?: 0, mediaInfo?.metadata?.mediaType)`.
  - `protected open fun getImagePicker(): ImagePicker?` (E7): the `NitroImagePicker : ImagePicker` shim using the **non-deprecated** `onPickImage(MediaMetadata, ImageHints)` overload → `pickImage(metadata?.images ?: emptyList(), hints.type)`.
  - `getCastMediaOptions(context)`: builder with `setImagePicker(getImagePicker())`, `setExpandedControllerActivityClassName(NitroExpandedControllerActivity::class.java.name)`, `setNotificationOptions(getNotificationOptions(context))` (null disables — documented mechanism).
  - `getAdditionalSessionProviders` → `null`.
- [ ] **Step 4: `HybridCastTransport.kt`** —
  - new method (contract ii, v4 parity):

```kotlin
  override fun showPlayServicesErrorDialog(errorCode: Double): Promise<Boolean> {
    val promise = Promise<Boolean>()
    runOnMain {
      val activity = currentActivityOrNull()
      if (activity == null) {
        promise.resolve(false)
        return@runOnMain
      }
      try {
        val shown = GoogleApiAvailability.getInstance()
          .showErrorDialogFragment(activity, errorCode.toInt(), 0)
        promise.resolve(shown)
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }
```

  - **E8 message rewrite (1A)**: replace the `ActivityNotFoundException` rejection text — the activity ships pre-registered via the library manifest; hitting this means the manifest merge was overridden (stale manual declaration / `tools:node` removal) or Play Services is unavailable — check the merged manifest and `getPlayServicesState()`.
- [ ] **Step 5: tests** —
  - `CastOptionsDefaultsTest.kt` (plain JUnit): **vector-driven** from `fixtures/cast-options/heuristics.json` (path-walk to repo root like the converter corpus loader) mapping symbolic surfaces/actions → GCK constants (skip iOS-only `custom`), covering every `pickImage` + `notificationActionsFor` vector, plus the boundary cases (`queueItemCount == 1`, `mediaType == null`).
  - `NitroCastOptionsProviderTest.kt` (Robolectric): meta-data matrix via the shadow package manager — receiver absent/blank → `CC1AD845`, explicit id passes through; notifications absent/true/false; `getCastOptions()` wiring — expanded-controller class name set, image picker present, `castMediaOptions.notificationOptions == null` when disabled; subclass seam smoke test (override `getNotificationOptions` only — rest of the wiring intact, E7).
- [ ] **Step 6:** Android gate (`compileDebugKotlin` + `testDebugUnitTest`), commit `feat(v5): NitroCastOptionsProvider, library-manifest activity + theme, image picker, PlayServices dialog (v5-9yc.5)`, push.

---

### Task 8: Assemble, review, PR (bead `v5-9yc.6`)

- [ ] **Step 1: integration branch** from the Task 1 barrier commit:

```bash
git checkout v5 && git checkout -b petrbela/phase6.2
git merge --no-ff origin/petrbela/p62-ts
git merge --no-ff origin/petrbela/p62-ios
git merge --no-ff origin/petrbela/p62-android
```

- [ ] **Step 2: example wiring (3A)** —
  - delete `example/android/app/src/main/java/com/castexample/CastOptionsProvider.kt`;
  - example manifest: `OPTIONS_PROVIDER_CLASS_NAME` → `com.margelo.nitro.googlecast.NitroCastOptionsProvider`; add `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` = `CC1AD845` (explicit, mirrors plugin output); **remove** the manual `NitroExpandedControllerActivity` declaration (now library-supplied);
  - `example/App.tsx`: "PlayServices dialog" probe button — `CastContext.showPlayServicesErrorDialog(CastContext.getPlayServicesState())`, log the boolean into the event log.
- [ ] **Step 3: combined verification** — jest/tsc/prettier + Android gate (compile **and** `testDebugUnitTest`) + both iOS gates (build **and** `xcodebuild test`) after `pod install`; **merged-manifest gate (E5)**:

```bash
grep -q "com.margelo.nitro.googlecast.NitroExpandedControllerActivity" \
  example/android/app/build/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml
grep -q "com.margelo.nitro.googlecast.NitroCastOptionsProvider" \
  example/android/app/build/intermediates/merged_manifests/debug/processDebugManifest/AndroidManifest.xml
```

- [ ] **Step 4: two-stage subagent review** (harness Agent tool):
  - TS/plugin diff reviewer (`git diff <barrier>..HEAD -- src/ docs/`): CRITICAL v4-absence assertions present + green, E4/E6/E8/E10 landed, façade map matches the Android converter values, docs match behavior (esp. iOS-lock-screen honesty + E7 interplay paragraph);
  - iOS diff reviewer (`-- ios/ example/ios/`): E1 `.castDialog` mapping, contract-i install point + nil-guard, E9 seam + single guarded singleton test, dialog stub resolves false;
  - Android diff reviewer (`-- android/`): contract-iii reentrancy (no `getSharedInstance` in `getCastOptions`), lazy notification-time resolution, E5 proguard + consumerProguardFiles, E7 seams, E8 message rewrite, no uses-permission added (vi), vector loader parity with the iOS loader;
  - holistic reviewer (full diff): drift surfaces aligned, all E1–E11 landed, failure-mode table rows hold, example wiring matches plugin output.
  Fix findings; re-run verification.
- [ ] **Step 5: PR to `v5`** (`gh pr create --base v5 --title "feat(v5): Phase 6 Slice 6.2 — Cast setup, notifications & expanded-controller customization (v5-9yc.2/.3/.4/.5/.6)"`). PR CI runs both native test suites (7A) — the authoritative gate. **Squash-merge requires explicit driver approval.** Fix CodeRabbit threads before merge.
- [ ] **Step 6:** cleanup — delete worktrees + lane branches; `bd close v5-9yc.2 v5-9yc.3 v5-9yc.4 v5-9yc.5 v5-9yc.6` (device-gated items stay listed under the open `v5-8hq.6` pass).

---

## Failure-mode coverage (every row must hold after Task 8)

| Codepath | Handling | Covered by |
|----------|----------|------------|
| 6.1-upgrader kept the manual `<activity>` | loud gradle merger error + migration-guide fix (1A) | docs (Task 5); build-time by construction |
| Android 14 + notifications | impossible on CAF 22.x (no FGS path); floor documented (E2/vi) | design verification; notifications.md |
| CAF pin < 21.3.0 via plugin prop | prebuild `console.warn` w/ #447/#527 (E8) | plugin test (Task 3) |
| Release build strips the provider (R8) | consumer proguard keep rule (E5) | Task 7 files; docs note for custom providers |
| v4→v5 Expo upgrade, `--no-clean` | plugin removes v4 residue (E6) | plugin fixture tests (Task 3) |
| Meta-data absent/blank receiver id | default-receiver fallback (iv) | Robolectric (Task 7) |
| Provider throws / meta-data typo | GCK `IllegalStateException`; guarded first-touch paths degrade to `noDevicesAvailable` (E11a) | troubleshooting.md + existing transport guards |
| `getCastOptions` reentrancy | prohibited (contract iii); lazy notification-time resolution | Android diff review checklist |
| Picker: no images | null → plain notification | vector tests both platforms (E3) |
| Cross-platform heuristic drift | shared JSON vectors; divergence = red test (E1/E3) | CastOptionsDefaultsTest + NitroImagePickerTests |
| iOS picker clobbers consumer's | `installIfAbsent` nil-guard (contract i, E9) | seam XCTest |
| GCK changes unset-picker semantics | single guarded singleton pin test fails loudly | NitroImagePickerTests |
| PlayServices dialog: no Activity / `success` | resolve `false` (contract ii) | castUi.test (TS) + Task 7 code |
| PlayServices dialog on iOS/web | resolve `false` (8A) | Task 6 stub + web stub + JSDoc |
| Plugin: manual GCK init in AppDelegate | descriptive error naming `iosSkipAppDelegateInit` (v/E10) | plugin fixture test (Task 4) |
| Plugin: unknown AppDelegate shape | descriptive anchor-miss error (v) | plugin fixture test (Task 4) |
| Plugin: double prebuild | idempotent (tag-replace/upsert; E4) | both plugin suites |
| Custom provider ignores plugin props | documented interplay (E7) | setup.md paragraph |

**Device-gated (real hardware, post-merge — listed with `v5-8hq.6`):** notification/lock-screen rendering + actions per media type, notification tap → expanded controller, theme override, artwork on real widgets, Play Services dialog rendering, Android 14+ smoke.

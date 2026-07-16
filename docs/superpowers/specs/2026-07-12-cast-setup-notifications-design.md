# Cast setup, notifications & expanded-controller customization — design (Phase 6, slice 6.2, bead `v5-9yc`)

**Status:** approved design (eng review 2026-07-16, amendments E1–E11 below), pre-implementation
**Date:** 2026-07-16 (plan approved 2026-07-12/13)
**Beads:** `v5-9yc.1` (this design), `v5-9yc.2`–`.6` (barrier / TS+plugin+docs / iOS / Android / integration)

## Goal

Close the consumer-setup story deferred by the 6.1 Non-goals. Today v5 has zero
`NotificationOptions`/`CastMediaOptions` wiring, no image picker on either
platform, a stock `NitroExpandedControllerActivity` that every app must
register manually (E8 `notSupported` rejection otherwise), and an Expo config
plugin that still emits **v4 class names** — it cannot produce a working v5
app. This slice ships:

- a **library `OptionsProvider`** (`NitroCastOptionsProvider`) with v4-parity
  notification actions and image selection, activated by manifest meta-data;
- the **library-manifest declaration** of `NitroExpandedControllerActivity`
  (auto-registered, consumer-overridable theme) — no more manual `<activity>`;
- a **default image picker on both platforms** (iOS gains one for the first
  time via `GCKCastContext.imagePicker`);
- **`CastContext.showPlayServicesErrorDialog()`** (v4 parity, Android-only
  behavior);
- the **Expo config-plugin v5 rewrite** (v5 class names, prop-schema refresh,
  CRITICAL regression tests);
- docs: bare-RN recipe, custom-provider recipe, notifications guide,
  migration notes.

## Decisions (locked with the driver, 2026-07-12)

1. **Library-manifest activity.** `NitroExpandedControllerActivity` is declared
   in `android/src/main/AndroidManifest.xml` with `android:exported="false"`
   and a library-defined overridable theme `@style/NitroCastExpandedController`
   (parent `Theme.AppCompat.NoActionBar`). `appcompat` 1.7.0 is a **direct
   dependency of play-services-cast-framework 22.0.0** (verified on the
   resolved `debugRuntimeClasspath`), and the activity carries its own theme,
   so the app's theme family is irrelevant. Consumers override by redefining
   the style (resource merging). The Expo plugin stops adding the `<activity>`.
   - **1A guidance sweep:** E8 rejection message rewritten (the activity now
     ships pre-registered), `ExpandedController.md` updated ("remove any manual
     declaration from 6.1"), migration-guide merger-conflict note, example
     manifest cleanup. E8's `ActivityNotFoundException → notSupported` path
     stays as defensive fallback with new text.
2. **Ship a library OptionsProvider** reading manifest meta-data and wiring
   `CastMediaOptions` (notifications + image picker + expanded controller).
   Docs also cover writing a custom provider (the escape hatch for custom
   actions).
3. **Image selection = native default only.** v4-Android-parity heuristic on
   both platforms; no JS-configurable selection in 6.2.
4. **Notification actions = v4-parity defaults** (validated by repo history —
   the heuristic was iterated for user requests #238/#252):
   queue → prev/toggle/next/stop (compact {1,2}), photo → toggle/stop
   (compact {0,1}), default → rewind/toggle/forward/stop (compact {1,3}).

## Acceptance criteria (5A — named contracts, official-docs verified 2026-07-16)

### i. iOS image-picker lifecycle contract

**One owner, one assignment point:** `HybridCastTransport.initAndSubscribe`'s
main-queue hop (the library's first touch of `GCKCastContext`; GCK UI-category
work is main-thread by convention — the SDK documents main-thread only for
`setSharedInstanceWithOptions:`, so we follow the stricter convention).

**Don't-clobber rule:** assign only when `context.imagePicker == nil`. The
GCK 4.8.4 header (`GCKCastContext+UI.h:63-66`) declares the property
`nullable` — "A default implementation will be used if one is not provided by
the application. May be set to `nil` to reinstate the default image picker" —
i.e. *unset reads `nil`*; the internal default is not exposed through the
property. A consumer-set picker (assigned in AppDelegate, which always runs
before RN/transport init) therefore reads non-nil and is never overwritten.
An XCTest pins the unset-reads-nil assumption empirically against the real
SDK (if a GCK upgrade ever breaks it, the test fails loudly).

Neither the Expo plugin nor the bare-app recipe injects picker code — the
single assignment point in the library covers both consumer classes
identically. Consumers wanting custom selection set
`GCKCastContext.sharedInstance().imagePicker` in their AppDelegate (documented
in `customize-ui.md`); the library never clobbers it. `dispose()` does not
reset the picker (harmless across reloads; re-init re-checks nil).

Official refs: [GCKCastContext(UI) `imagePicker`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_context),
[GCKUIImagePicker](https://developers.google.com/cast/docs/reference/ios/protocol_g_c_k_u_i_image_picker-p),
["Override image selection and caching"](https://developers.google.com/cast/docs/ios_sender/advanced)
("The framework provides a default implementation … which always selects the
first image").

**Selector correction (from verification):** the protocol method is
`getImageWithHints:fromMetadata:` — Swift `getImageWith(_:from:)` — **not**
`image(with:from:)` (pre-4.3.4 name). Verified by compiling a conformance stub
against the local 4.8.4 xcframework.

### ii. `showPlayServicesErrorDialog(errorCode)` (transport) / `showPlayServicesErrorDialog(playServicesState)` (façade)

Reuses the transport's existing foreground-activity resolution + main-queue
hop (same pattern as `showCastDialog`/`showExpandedControls`). `errorCode` is
pinned to `getPlayServicesState` output via the TS-side map (the exact reverse
of the Android converter, verified against
[ConnectionResult](https://developers.google.com/android/reference/com/google/android/gms/common/ConnectionResult)):
`success 0 · missing 1 · updateRequired 2 · disabled 3 · invalid 9 · updating 18`.
No current Activity → resolve `false`. Android presents via
[`GoogleApiAvailability.showErrorDialogFragment(activity, errorCode, 0)`](https://developers.google.com/android/reference/com/google/android/gms/common/GoogleApiAvailability)
(v4 parity; returns the shown-boolean; the docs pin "If errorCode is SUCCESS
then null is returned" for the underlying dialog, i.e. `success` → `false`).
iOS/web resolve `false` (v4 iOS resolved `NO`; 8A).

### iii. Reentrancy rule

`NitroCastOptionsProvider.getCastOptions()` **never calls
`CastContext.getSharedInstance()`** — it is *called from inside* that
initialization ([`getSharedInstance` throws `IllegalStateException` on
provider failure](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastContext)).
It reads only `Context`/`PackageManager`. The notification-actions callbacks
resolve `CastContext.getSharedInstance()` (the zero-arg `@Nullable` variant)
**lazily at notification-build time** — the v4 pattern, safe because those
callbacks run long after init completes.

### iv. Bare-RN activation recipe

App manifest, inside `<application>`:

```xml
<meta-data
  android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
  android:value="com.margelo.nitro.googlecast.NitroCastOptionsProvider" />
<!-- optional; defaults to the Default Media Receiver (CC1AD845) -->
<meta-data
  android:name="com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID"
  android:value="ABCD1234" />
```

Receiver-id fallback: absent/blank meta-data →
[`CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID`](https://developers.google.com/android/reference/com/google/android/gms/cast/CastMediaControlIntent)
(constant value `"CC1AD845"`, matching iOS
`kGCKDefaultMediaReceiverApplicationID` — same literal verified in the 4.8.4
framework binary). Failure behavior: a missing/typo'd
`OPTIONS_PROVIDER_CLASS_NAME` or a provider that throws →
`IllegalStateException` from `CastContext.getSharedInstance()` (documented
SDK behavior); the transport's existing `sharedCastContextOrNull()` guard
degrades v5 to `noDevicesAvailable` rather than crashing, and
`troubleshooting.md` documents the logcat signature. Malformed
*receiver-id* meta-data cannot crash: any non-blank string is passed through
(a wrong id simply fails to discover/launch), blank/absent falls back to the
default receiver — Robolectric-tested.

### v. AppDelegate injection policy (Expo plugin, iOS)

- **Supported template shapes as test fixtures:** the v4-era objc
  `AppDelegate.mm` (existing fixture, anchor
  `didFinishLaunchingWithOptions` regex) and the RN 0.86 Swift template
  (new fixture mirroring `example/ios/CastExample/AppDelegate.swift`, anchor
  `let delegate = ReactNativeDelegate()` — already what the plugin targets).
- **Idempotency:** `mergeContents` tag
  (`react-native-google-cast-didFinishLaunchingWithOptions`) — re-running
  prebuild replaces the tagged block, never duplicates it (fixture test runs
  the mod twice and asserts a single block).
- **Conflict policy:** if the AppDelegate already initializes
  `GCKCastContext` (`setSharedInstanceWith` present *outside* our tagged
  block), the plugin **throws a descriptive error** telling the user to
  remove the manual init (the plugin owns it) or drop the plugin — not a
  silent skip. An unmatched anchor (unrecognized AppDelegate shape) likewise
  surfaces as a clear plugin error naming the file and the expected anchor,
  with a pointer to the manual-setup docs. Both paths are fixture-tested.

### vi. Android 14 FGS verification (6RA) — **resolved: no permissions needed**

Verified against the pinned `play-services-cast-framework:22.0.0` AAR
(gradle cache, manifest + `classes.jar` inspection, 2026-07-16):

- The AAR manifest itself declares `android.permission.FOREGROUND_SERVICE`
  (merged into every consuming app — confirmed present in the example's
  merged manifest) plus `ACCESS_NETWORK_STATE`.
- **`MediaNotificationService` does not exist in the 22.0.0 artifact** — no
  manifest entry, zero references in `classes.jar` (no `startForeground`
  call sites at all). Cast release notes, Android Sender 21.3.0 (Mar 2023):
  "NotificationManager is now used to post Cast media notifications instead
  of Foreground Service." The v4 Android-14 crash class (#447/#527,
  `Unable to start service … MediaNotificationService`) is **structurally
  impossible** on the 22.x pin: there is no foreground service to start, so
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK` wiring would annotate a service that
  isn't on the classpath.
- Nuance for the failure-modes table: issue #447's crash shares the outer
  signature but has a *different root cause* — a CAF 21.1.0 regression where
  `setExpandedControllerActivityClassName` named an unresolvable activity
  class. v5 is immune by construction: the class ships in this library and
  is declared in the library manifest.
- **Deliverable becomes docs, not manifest wiring:** `notifications.md`
  documents (a) the CAF version floor — consumers overriding
  `castFrameworkVersion` below 21.3.0 re-enter the FGS world at their own
  risk (cite #447/#527); (b) the real modern concern,
  `android.permission.POST_NOTIFICATIONS` (API 33+ runtime permission,
  declared by neither the AAR nor the library) — without it Android 13+
  users who deny/never grant notifications simply don't see the cast
  notification; declaring + requesting it is app policy, so v5 documents it
  rather than auto-adding a permission (v4 parity: v4 never added it
  either).

Refs: [Cast SDK release notes](https://developers.google.com/cast/docs/release-notes),
[Android 14 FGS types](https://developer.android.com/about/versions/14/changes/fgs-types-required),
react-native-google-cast#447, #527.

## Public API

```ts
// CastContext façade addition (v4 shape, 8A)
/**
 * Show a dialog with a localized message about the Play Services error state
 * … (v4 wording).
 * @platform android — resolves `false` on iOS and web.
 * @param playServicesState state returned from {@link CastContext.getPlayServicesState};
 *   `success` shows nothing and resolves `false`.
 */
static showPlayServicesErrorDialog(
  playServicesState: PlayServicesState
): Promise<boolean>
```

```jsonc
// Expo plugin props (app.json) — v5 schema
{
  "receiverAppId": "…",                               // unchanged (both platforms)
  "androidReceiverAppId": "…",                        // unchanged (key emitted is v5-namespaced)
  "iosReceiverAppId": "…",                            // unchanged
  "androidOptionsProvider": "com.acme.MyProvider",    // NEW (2A) — FQN written to
                                                      // OPTIONS_PROVIDER_CLASS_NAME; default
                                                      // com.margelo.nitro.googlecast.NitroCastOptionsProvider
  "androidNotificationsEnabled": false,                // NEW — default true; false writes the
                                                      // NOTIFICATIONS_ENABLED meta-data
  "androidPlayServicesCastFrameworkVersion": "22.0.0", // unchanged
  "expandedController": true,                          // kept; now iOS-only effect
                                                      // (useDefaultExpandedMediaControls) —
                                                      // Android side is automatic in v5
  "iosDisableDiscoveryAutostart": false,               // unchanged
  "iosStartDiscoveryAfterFirstTapOnCastButton": true,  // unchanged
  "iosSuspendSessionsWhenBackgrounded": true           // unchanged
}
```

Android meta-data keys (all under the v5 namespace):

| Key | Meaning | Default when absent |
|---|---|---|
| `com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME` | GCK activation (SDK-owned key) | — (required for Cast at all) |
| `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` | receiver app id | `CC1AD845` (default receiver) |
| `com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED` | media notification on/off | `true` |

**Migration note (breaking):** the receiver-id meta-data key changes from
`com.reactnative.googlecast.RECEIVER_APPLICATION_ID` to the
`com.margelo.nitro.googlecast.` namespace — bare-RN v4 upgraders must rename
it (Expo apps get it from prebuild automatically).

## Architecture

```
                    Expo app                          bare-RN app
                       │                                   │
              app.plugin.js props                   docs/setup.md recipe
                       │                                   │
                       ▼                                   ▼
        prebuild writes AndroidManifest  ◄──── consumer adds meta-data manually
        + Info.plist + AppDelegate init        + AppDelegate GCKCastOptions init
                       │                                   │
                       └────────────┬──────────────────────┘
                                    ▼
              OPTIONS_PROVIDER_CLASS_NAME meta-data
                                    │
                                    ▼
   Cast SDK init ──► NitroCastOptionsProvider.getCastOptions()   [no getSharedInstance — iii]
                        ├── receiver id (meta-data │ default CC1AD845)
                        └── CastMediaOptions
                              ├── NotificationOptions ── NotificationActionsProvider
                              │      └── notificationActionsFor(queueCount, mediaType)  [pure, JVM-tested]
                              │            (lazy context access at notification time)
                              ├── setImagePicker ── pickImage(images, hintType)         [pure, JVM-tested]
                              └── setExpandedControllerActivityClassName
                                       │
                                       ▼
                    NitroExpandedControllerActivity  ◄── library manifest (auto-registered,
                        theme @style/NitroCastExpandedController, consumer-overridable)
   iOS: transport init ──► imagePicker == nil? ──► NitroImagePicker (contract i) ── XCTest
        notifications/lock-screen: Android-only per Google's design checklist (docs, not code)
```

### Transport surface (barrier, `v5-9yc.2`) — lands inline on `v5`

One new method on all drift surfaces (`src/transport/types.ts`,
`src/specs/CastTransport.nitro.ts`, `FakeCastTransport`, adapter, web stub) +
`yarn specs` regen:

```ts
// --- Cast setup / diagnostics UI (Phase 6.2) ---
/**
 * Present the Google Play Services error-resolution dialog for `errorCode`
 * (a ConnectionResult value — the façade converts from PlayServicesState).
 * `true` = the dialog was shown. No current Activity, `errorCode` needing no
 * dialog (success), or non-Android platform → resolves `false`. Never
 * rejects for graceful can't-show cases (E7 posture).
 */
showPlayServicesErrorDialog(errorCode: number): Promise<boolean>
```

- `errorCode` is not a C++ reserved word (nitrogen keyword hazard checked).
- Adapter: same value-returning `mutate` + `parseCastError` path as the 6.1
  `show*` methods. Web stub: `neverShown` (resolves `false`).
- Fake: `showPlayServicesErrorDialogCalls: number[]` (records codes) +
  scriptable `showPlayServicesErrorDialogBehavior` (default resolves `true`).
- **No new state slices, no StoreEvents, no `initAndSubscribe` change.**

### TS façade + Expo plugin + docs (TS lane, `v5-9yc.3`, branch `petrbela/p62-ts`, dirs `src/` + `docs/`)

**Façade (`src/api/CastContext.ts`):**
`showPlayServicesErrorDialog(playServicesState)` converts via a local
`PLAY_SERVICES_ERROR_CODE: Record<PlayServicesState, number>` map (values
pinned to the Android converter — see contract ii) and delegates to the
transport. JSDoc carries the v4 wording + `@platform android — resolves
false on iOS` (8A).

**Expo plugin rewrite (`src/plugin/`):**

- `withAndroidGoogleCast.ts`:
  - `OPTIONS_PROVIDER_CLASS_NAME` ← `androidOptionsProvider` prop, default
    `com.margelo.nitro.googlecast.NitroCastOptionsProvider` (2A).
  - Receiver meta-data key → `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID`.
  - `androidNotificationsEnabled === false` → write
    `NOTIFICATIONS_ENABLED` meta-data `"false"` (absent otherwise — provider
    defaults to `true`).
  - **Drop** the `<activity>` add (library manifest now owns it) and the
    entire `withMainActivityLazyLoading` mod (`RNGCCastContext` injection —
    dead in v5). MainActivity is untouched by the v5 plugin.
  - **Keep** the gradle wiring (`castFrameworkVersion` ext +
    `play-services-cast-framework` dep + `safeExtGet`), Groovy-only with the
    existing clear error (Kotlin-DSL support deferred, v4 parity).
- `withIosGoogleCast.ts`: Info.plist mods unchanged; AppDelegate injection
  kept for both languages under contract v (conflict detection + anchor-miss
  error). `expandedController` continues to drive
  `useDefaultExpandedMediaControls`
  ([official toggle](https://developers.google.com/cast/docs/ios_sender/integrate)).
- `withGoogleCast.ts`: prop schema refresh per Public API; JSDoc for every
  prop.
- **Tests (CRITICAL regression requirement):** new
  `withAndroidGoogleCast-test.ts` asserting on fixture app-manifest/gradle
  inputs: v5 class names emitted; **absence** of
  `com.reactnative.googlecast.GoogleCastOptionsProvider`,
  `RNGCExpandedControllerActivity`, any `<activity>` addition, and any
  MainActivity modification; `androidOptionsProvider` override respected;
  receiver-id + notifications meta-data; gradle emissions. iOS tests extend
  the existing snapshot suite with the Swift RN 0.86 fixture, double-run
  idempotency, manual-init conflict error, and anchor-miss error (v).

**Docs:**

- `getting-started/setup.md` — Expo prop list refresh; bare-RN Android
  recipe (iv); custom-provider recipe (subclass `NitroCastOptionsProvider`
  to override the receiver id / notification actions, or write your own
  `OptionsProvider` — the custom-actions escape hatch).
- `guides/notifications.md` (new) — Android notification + lock-screen
  behavior, default actions table (Decision 4), disabling via prop/meta-data,
  `POST_NOTIFICATIONS` note, CAF ≥21.3.0 floor note (vi); **iOS: per
  [Google's sender design checklist](https://developers.google.com/cast/docs/design_checklist/sender),
  notifications and lock-screen controls are Android-only** ("it is not
  possible to implement notifications in iOS or Chrome") — v5 adds no iOS
  notification surface; consumers wanting iOS lock-screen UI must drive
  `MPNowPlayingInfoCenter` themselves (out of scope, documented honestly).
- `components/ExpandedController.md` — registration section replaced by
  "automatic since this release; **remove any manual `<activity>`
  declaration** from 6.1" + theme-override recipe (1A).
- `guides/customize-ui.md` — image-picker defaults + override recipes
  (iOS AppDelegate `imagePicker`; Android custom OptionsProvider); theme
  override.
- `getting-started/installation.md` — Expo section refresh.
- `guides/migrating-v4-to-v5.md` — manifest-merger note (1A): 6.1 upgraders
  with a manual `<activity>` declaration hit an `android:theme`
  attribute-conflict build error — fix: delete the declaration (or
  `tools:replace` if intentionally overriding); receiver-id meta-data key
  rename; `showPlayServicesErrorDialog` platform note (8A); notification
  defaults parity statement.

### iOS (`v5-9yc.4`, branch `petrbela/p62-ios`, dirs `ios/` + `example/ios/NitroGoogleCastTests/`)

- **`ios/NitroGoogleCast/NitroImagePicker.swift`** —
  `final class NitroImagePicker: NSObject, GCKUIImagePicker` implementing
  `getImageWith(_ imageHints: GCKUIImageHints, from metadata: GCKMediaMetadata) -> GCKImage?`
  as a one-line shim over the pure static
  `pickImage(from images: [GCKImage], imageType: GCKMediaMetadataImageType) -> GCKImage?`
  (4A): empty → `nil`; single → first; `.background` (= 3, the iOS analogue
  of v4-Android's `IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND`
  branch) → first; otherwise second.
- **`HybridCastTransport.swift`**: in `initAndSubscribe`'s existing main-queue
  hop, install the picker under contract i (nil-check guard). New
  `showPlayServicesErrorDialog(errorCode: Double)` → resolves `false` (8A).
- **XCTest (`example/ios/NitroGoogleCastTests/NitroImagePickerTests.swift`,
  converter-suite pattern):** the 3 picker branches with constructed
  `GCKMediaMetadata`/`GCKImage` + `GCKUIImageHints`; plus the contract-i pin:
  a freshly-configured `GCKCastContext` reads `imagePicker == nil`, and a
  pre-set picker is not overwritten by the install helper.
- No notification/lock-screen code (refuted claim — see `notifications.md`
  deliverable).

### Android (`v5-9yc.5`, branch `petrbela/p62-android`, dirs `android/`)

- **`android/src/main/AndroidManifest.xml`** (currently an empty stub):

  ```xml
  <manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
      <activity
        android:name="com.margelo.nitro.googlecast.NitroExpandedControllerActivity"
        android:exported="false"
        android:theme="@style/NitroCastExpandedController" />
    </application>
  </manifest>
  ```

  No `<uses-permission>` additions (vi). New
  `android/src/main/res/values/styles.xml`:

  ```xml
  <style name="NitroCastExpandedController" parent="Theme.AppCompat.NoActionBar" />
  ```

- **`NitroCastOptionsProvider.kt`** — `open class` (subclassable, v4 parity)
  implementing `OptionsProvider`:
  - `protected open fun getReceiverApplicationId(context)`: meta-data →
    blank/absent falls back to
    `CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID` (iv).
  - `protected open fun getCastMediaOptions(context)`: notifications enabled
    (meta-data, default true) → `NotificationOptions` with a
    `NotificationActionsProvider` shim + `setImagePicker(NitroImagePicker())`
    + `setExpandedControllerActivityClassName(NitroExpandedControllerActivity::class.java.name)`;
    disabled → `.setNotificationOptions(null)` (the documented disable
    mechanism) while keeping picker + expanded-controller wiring.
  - Reentrancy per contract iii.
- **`CastOptionsDefaults.kt`** (internal, pure — 4A):
  - `data class NotificationActionsSpec(actions: List<String>, compactViewIndices: IntArray)`
  - `notificationActionsFor(queueItemCount: Int, mediaType: Int?): NotificationActionsSpec`
    — Decision 4 branches (`queueItemCount > 1` = queue;
    `MEDIA_TYPE_PHOTO` = photo).
  - `pickImage(images: List<WebImage>, hintType: Int): WebImage?` — v4
    heuristic (empty → null; single → first; dialog-background hint → first;
    else second).
  - GCK callback classes (`NotificationActionsProvider` subclass,
    `NitroImagePicker : ImagePicker` using the **non-deprecated**
    `onPickImage(MediaMetadata, ImageHints)` overload) are one-line shims
    over these.
- **`HybridCastTransport.kt`**:
  - `showPlayServicesErrorDialog(errorCode: Double)` — `runOnMain`,
    `currentActivityOrNull() ?: resolve(false)`,
    `GoogleApiAvailability.getInstance().showErrorDialogFragment(activity, errorCode.toInt(), 0)`
    → resolve the returned boolean (contract ii; v4 parity).
  - **E8 message rewrite (1A):** the `ActivityNotFoundException` fallback no
    longer instructs manual registration — new text: the activity ships
    pre-registered via the library manifest; hitting this means the manifest
    merge was overridden (e.g. a stale manual declaration removed it via
    `tools:node`) or Play Services/Cast framework is unavailable — check the
    merged manifest and `getPlayServicesState()`.
- **Tests:**
  - JVM (plain JUnit): every `notificationActionsFor` branch (queue / photo /
    default / boundary `queueItemCount == 1` / `mediaType == null`) and every
    `pickImage` branch.
  - Robolectric: `NitroCastOptionsProviderTest` — meta-data parsing via the
    shadow `PackageManager` (receiver fallback on absent + blank, explicit
    id, notifications toggle true/false/absent), and
    `getCastOptions()` wiring assertions (expanded-controller class name,
    picker present, notification options null when disabled).

### Integrate (`v5-9yc.6`, branch `petrbela/phase6.2`, dirs `example/` + merges)

- `git merge --no-ff` each lane onto `petrbela/phase6.2`.
- **Example wiring (3A):** delete `example/android/.../CastOptionsProvider.kt`;
  manifest meta-data → `NitroCastOptionsProvider` +
  `RECEIVER_APPLICATION_ID` (`CC1AD845`, explicit to mirror plugin output);
  **remove** the manual `NitroExpandedControllerActivity` declaration; add a
  "PlayServices dialog" probe button to `App.tsx`
  (`CastContext.showPlayServicesErrorDialog(CastContext.getPlayServicesState())`).
- Combined verification (7A gates below), two-stage subagent review
  (per-lane diff reviewers → holistic), single squash PR to `v5` for driver
  approval, CodeRabbit threads fixed before merge, worktrees/branches
  deleted, `bd close`.

## Error handling

- `showPlayServicesErrorDialog` follows the 6.1 E7 posture: graceful
  can't-show (no Activity, `success` code, iOS/web) → resolve `false`;
  unexpected native throw → typed `CastError` via `parseCastError`.
- `NitroCastOptionsProvider` failures surface as GCK's documented
  `IllegalStateException` at init (iii/iv); the library's existing
  `sharedCastContextOrNull()` guards degrade JS to `noDevicesAvailable`
  instead of crashing; troubleshooting docs carry the logcat signature.
- Image pickers return `nil`/`null` gracefully (plain notification, default
  artwork) — never throw.
- Plugin errors (conflict, anchor miss, Kotlin gradle) are loud prebuild
  errors with actionable messages (v).

## Failure modes

| Codepath | Failure | Test? | Handled? | User sees |
|----------|---------|-------|----------|-----------|
| 6.1-upgrader manifest merge | theme attr conflict → build error | — (build-time) | 1A migration note | loud gradle error + documented fix |
| Android 14 + notifications | (was) MediaNotificationService crash | 6RA verification | impossible on 22.x — no FGS path exists; docs pin the ≥21.3.0 floor | none |
| CAF pin overridden < 21.3.0 | FGS crash class returns | — (docs) | documented at own-risk + cite #447/#527 | documented |
| API 33+, permission denied | notification never shows | — (docs) | `POST_NOTIFICATIONS` documented as app policy | documented |
| Meta-data absent/malformed | wrong receiver / init throw | Robolectric (iv) | default-receiver fallback; provider throw = GCK `IllegalStateException`, degraded to `noDevicesAvailable` | casts to default receiver / troubleshooting entry |
| `getCastOptions` reentrancy | init recursion/crash | design rule iii + review | prohibited by contract | none |
| Picker: no images | null artwork | JVM + XCTest | returns null gracefully | plain notification |
| iOS picker clobbers consumer's | silent behavior override | XCTest (contract i) + review | nil-check guard | none |
| GCK changes unset-picker semantics | library picker silently not installed | XCTest pin (contract i) | test fails loudly on SDK upgrade | none |
| PlayServices dialog: no activity | can't present | castUi.test via fake (TS) + code path | resolve `false` (guard pattern) | `false` result |
| `setExpandedControllerActivityClassName` unresolvable (#447 root cause) | notification-tap crash | — (structural) | class ships + registers in this library | none |
| Plugin: unknown AppDelegate shape / manual GCK init | bad injection / double init | plugin fixture tests (v) | descriptive prebuild error | clear error with fix |
| Plugin: Kotlin build.gradle | unsupported | existing behavior | clear throw (v4 parity, deferred) | clear error |

## Testing

- **TS:** `yarn typescript && yarn lint && yarn test` — castUi tests extended
  (façade state→code conversion for every `PlayServicesState`, pass-through
  resolution/rejection, drift surfaces); plugin regression suites (Android
  CRITICAL assertions + iOS objc/Swift fixtures, idempotency, conflict &
  anchor-miss errors).
- **Android:** `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME=~/Library/Android/sdk ./gradlew :react-native-google-cast:compileDebugKotlin :react-native-google-cast:testDebugUnitTest`
  from `example/android` (7A — compile AND the JVM/Robolectric suites;
  library-manifest merge validated implicitly by the example build).
- **iOS:** `pod install` in `example/ios`; NitroGoogleCast build gate **plus**
  `xcodebuild test` on the `NitroGoogleCastTests` scheme, iphonesimulator
  (7A).
- **PR CI** is the authoritative native gate and must run both native test
  suites (7A).
- **Device-gated** (no hardware in this pass; listed with the open
  `v5-8hq.6` items): notification/lock-screen rendering + actions,
  notification tap → expanded controller, theme override on device, artwork
  output on real widgets, Play Services dialog rendering, behavior on a real
  Android 14+ device.

## Decomposition (barrier-first, 6.1/5.2 lane shape)

- **`v5-9yc.1`** — this design (eng review + amendments).
- **`v5-9yc.2` (barrier)** — inline on `v5`: transport method on all drift
  surfaces + adapter + web stub + fake + `yarn specs` regen; `yarn
  typescript`/`yarn test`/prettier green. **CHECK IN with the driver before
  fanning out.**
- **`v5-9yc.3` (TS lane)** — `petrbela/p62-ts`: façade + plugin rewrite +
  plugin tests + docs.
- **`v5-9yc.4` (iOS lane)** — `petrbela/p62-ios`: NitroImagePicker + install
  point + dialog stub + XCTests.
- **`v5-9yc.5` (Android lane)** — `petrbela/p62-android`: manifest + style +
  provider + defaults + dialog + E8 rewrite + JVM/Robolectric tests.
- **`v5-9yc.6` (integrate)** — `petrbela/phase6.2`: merges, example wiring,
  gates, two-stage review, squash PR to `v5`.

Lane dir sets are disjoint (TS: `src/`+`docs/`; iOS: `ios/`+
`example/ios/NitroGoogleCastTests/`; Android: `android/`); `example/android`
+ `example/App.tsx` are integrate-owned. All lanes branch from the barrier
commit.

## Eng-review amendments (2026-07-16)

Accepted findings from the design eng review (4-section pass + Codex
outside-voice cross-model challenge, 12 points → 6 tensions, all accepted).
Where an amendment contradicts a body section above, the amendment wins.

- **E1 — iOS picker keys on `.castDialog`, not `.background` (P2).** The SDK
  header (`GCKUIImageHints.h`) pins `.castDialog` = "image used in the Cast
  dialog" — the true analogue of v4-Android's
  `IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND` branch — while
  `.background` is the expanded-controller/fullscreen image, which v4-Android
  routes to the **second** image. Corrected mapping: `.castDialog` → first;
  `.background`/`.miniController`/`.custom` → second. XCTest pins this.
- **E2 — 6RA docs-only resolution ratified.** The plan-T2 deviation (no FGS
  permissions wired; version-floor + `POST_NOTIFICATIONS` docs instead) is
  driver-approved on the artifact evidence (criterion vi).
- **E3 — shared cross-platform heuristic vectors.** The picker + notification
  heuristics get one shared JSON vector file (converter-corpus pattern, e.g.
  `fixtures/cast-options/heuristics.json`) read by both the JVM and XCTest
  suites: `{surface, imageCount → expectedIndex|null}` and
  `{queueItemCount, mediaType → actions[], compactIndices[]}`. Surfaces use
  symbolic names (`castDialog`, `background`, `notificationThumbnail`, …)
  mapped to platform constants in each loader shim (surfaces one platform
  can't represent are skipped by that loader). Drift between the Kotlin and
  Swift implementations becomes a red test, not a device-pass surprise.
  Authored in the **barrier commit** (its content is fully determined by this
  design, and both lanes branch from the barrier — an Android-lane-authored
  fixture would be invisible to the iOS lane until integrate).
- **E4 — Android plugin double-run idempotency test.** Mirror of the planned
  iOS test: run the Android mods twice on the same fixture; assert single
  meta-data entries and single tagged gradle blocks.
- **E5 — release-build survival (R8/ProGuard + merged-manifest gate).**
  `OPTIONS_PROVIDER_CLASS_NAME` instantiates `NitroCastOptionsProvider`
  reflectively — invisible to R8. The Android lane adds
  `android/proguard-rules.pro` (`-keep class
  com.margelo.nitro.googlecast.NitroCastOptionsProvider { <init>(); }`) wired
  via `consumerProguardFiles` in `android/build.gradle`; docs note that a
  custom/subclassed provider needs the consumer's own keep rule. Integrate
  verification additionally greps the example's merged manifest
  (`build/intermediates/merged_manifests/`) for
  `NitroExpandedControllerActivity` + the provider meta-data value — the
  library-manifest claim is verified, not assumed.
- **E6 — plugin removes v4 residue (P2, migration).** For `--no-clean`
  prebuild upgraders, the Android plugin actively deletes the exactly-known
  v4 emissions: the `com.reactnative.googlecast.RECEIVER_APPLICATION_ID`
  meta-data, any `com.reactnative.googlecast.RNGCExpandedControllerActivity`
  `<activity>`, the v4 `react-native-google-cast-onCreate` tagged MainActivity
  block (`removeContents`), and the stray
  `import com.reactnative.googlecast.api.RNGCCastContext` line. Each removal
  is fixture-tested on v4-shaped inputs (extends the CRITICAL regression
  suite).
- **E7 — real subclass seams + props-interplay docs.**
  `NitroCastOptionsProvider` exposes finer protected hooks —
  `protected open fun getNotificationOptions(context): NotificationOptions?`
  and `protected open fun getImagePicker(): ImagePicker?` — so a subclass
  overrides exactly one concern instead of rebuilding `getCastMediaOptions`.
  `setup.md` states explicitly that `receiverAppId`/`androidReceiverAppId`/
  `androidNotificationsEnabled` are meta-data writers consumed by
  `NitroCastOptionsProvider` (or subclasses that call super) — a from-scratch
  `androidOptionsProvider` ignores them.
- **E8 — plugin CAF-floor warning.** When
  `androidPlayServicesCastFrameworkVersion` parses to a version below 21.3.0,
  the plugin emits a prebuild `console.warn` citing #447/#527 and the FGS
  permissions that pre-21.3.0 pins require. Warn, not throw (dynamic/`+`
  versions and deliberate pins stay usable). Covered by a plugin test.
- **E9 — picker install behind a testable seam.** The iOS install logic is a
  static helper (e.g. `NitroImagePicker.installIfAbsent(current:
  GCKUIImagePicker?) -> GCKUIImagePicker?`) tested purely (nil → installs,
  non-nil → untouched) with **one** narrow, `isSharedInstanceInitialized`-
  guarded XCTest against the real singleton pinning the unset-reads-nil SDK
  assumption. Kills test order-dependence in the shared XCTest target.
- **E10 — `iosSkipAppDelegateInit` escape hatch (contract v refinement).**
  New plugin prop (default `false`). Default behavior unchanged: manual
  `GCKCastContext` init outside the tagged block → descriptive prebuild error
  — but the error message names the prop, and `iosSkipAppDelegateInit: true`
  skips only the AppDelegate mod (Info.plist wiring still applies) for apps
  that need fully custom `GCKCastOptions`. Fixture-tested (skip leaves
  AppDelegate untouched).
- **E11 — editorial.** (a) The graceful-degradation claim in criterion iv is
  backed by enumerating the guarded first-touch paths: the transport
  (`sharedCastContextOrNull()`), `HybridCastButton` (v4-style try/catch
  around `setUpMediaRouteButton`), and `showExpandedControls` (framework
  gate) — no unguarded `CastContext.getSharedInstance` call sites exist in
  the library. (b) `getting-started/troubleshooting.md` is added to the TS
  lane's docs list (carries the provider-failure logcat signature per
  criterion iv).

## Non-goals / deferred

- JS-configurable image selection / notification actions (custom
  OptionsProvider + `androidOptionsProvider` prop are the escape hatches).
- iOS lock-screen / now-playing integration (`MPNowPlayingInfoCenter`) — the
  Cast SDK has none (verified: Google design checklist + binary inspection);
  building our own is out of scope, documented honestly.
- `POST_NOTIFICATIONS` auto-wiring (declaration + runtime request are app
  policy; docs only).
- CastButton `triggersDefaultCastDialog` prop (dropped entirely).
- Web implementations of the UI surface (Phase 8).
- `v5-8hq.6` device-pass items (hardware-gated, unchanged).
- SPM migration, `InitialSnapshot.mediaStatus` fix, `v5-vlv` items.
- Plugin support for Kotlin build.gradle(.kts) (v4 parity: Groovy-only,
  clear throw).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 10 issues, 0 critical gaps (this design, commit e387460) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CROSS-MODEL:** Codex outside voice ran (2026-07-16, gpt-5.6): 12 points — 3 confirmed the in-review amendments (E1/E3/E4), 6 substantive tensions all accepted by the driver (E5 R8 keep rule + merged-manifest gate, E6 v4-residue removal, E7 subclass seams + props docs, E8 CAF-floor warning, E9 picker test seam, E10 iosSkipAppDelegateInit), 1 folded as editorial (E11a degradation-proof enumeration), 2 were restatements of review findings (no tension).
- **VERDICT:** ENG CLEARED — design approved with amendments E1–E11; proceed to bead cutting (v5-9yc.2–.6) and the implementation plan.

NO UNRESOLVED DECISIONS

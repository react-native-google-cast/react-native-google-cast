---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
---

## Can't see Cast Button / No Cast Devices Available

This is by far the most common problem with this library. Before creating an issue, please read through this list of known solutions to see if anything helps:

- Most TVs don't support the native Cast SDK protocol, so even if it appears that apps like YouTube and Netflix (and the Chrome browser) are able to Cast, they're in fact communicating directly with their counterpart app on the TV using [DIAL](https://www.howtogeek.com/215791/use-your-tv%E2%80%99s-hidden-%E2%80%9Cdial%E2%80%9D-feature-to-cast-netflix-and-youtube-without-a-chromecast/#:~:text=and%20Privacy%20Policy.-,Use%20Your%20TV's%20Hidden%20%E2%80%9CDIAL%E2%80%9D%20Feature%20to%20Cast%20Netflix,and%20YouTube%20Without%20a%20Chromecast&text=Many%20modern%20smart%20TVs%20have,computer%20%E2%80%94%20without%20getting%20a%20Chromecast), not the Cast SDK. Officially, only Chromecast, Android TV, and devices with the official Chromecast logo are supported by the SDK.

  To check if your device is supported:

  - Test with the reference [CastVideos-ios](https://github.com/googlecast/CastVideos-ios) or [CastVideos-android](https://github.com/googlecast/CastVideos-android) apps.

  - Try the Google Home, Google Photos, or another Cast-enabled app to make sure they can see the Cast device you're trying to connect to.

  If any of the above don't see the device, it doesn't support the Google Cast SDK, and you won't be able to cast to it using this library.

- Make sure you've completed all the steps in [Installation](./installation) and [Setup](./setup).

- Read through [Discovery Troubleshooting](https://developers.google.com/cast/docs/discovery) in the Google Cast documentation.

- If you're creating a [custom web receiver](https://developers.google.com/cast/docs/web_receiver) and its status is Unpublished in the [Google Cast SDK Developer Console](https://cast.google.com/publish), make sure you register your device in the **Cast Receiver Devices**. Once you do that, you need to wait about 15 minutes and then restart your Cast device.

- Check the Debug log in Xcode or Android Studio for any warnings and errors.

- (Android) Make sure the device has Google Play Services available (you can check with `CastContext.getPlayServicesState()`).

- (Android) Check the `OPTIONS_PROVIDER_CLASS_NAME` meta-data (see below): if the Cast SDK can't instantiate the options provider, v5 degrades to `noDevicesAvailable` instead of crashing — the Cast button simply never activates.

- (Android) **emulators** are [not supported](https://github.com/googlecast/CastVideos-android/issues/104#issuecomment-816290407). Please test with a real Android device before reporting an issue. Alternatively, you may try using [Genymotion](https://www.genymotion.com/) but note it [doesn't support M1/ARM Macs yet](https://support.genymotion.com/hc/en-us/articles/360017897157-Does-Genymotion-Desktop-work-on-Mac-M1-).

- (iOS) **Out of the box, the device list stays empty (and `castState` stays `noDevicesAvailable`) until the user taps the Cast button for the first time.** This is the Cast SDK's intended iOS 14+ behavior ([`startDiscoveryAfterFirstTapOnCastButton`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options), default `true`), and the first tap is only the **default** permission/discovery trigger — discovery is delayed until it so the [local network permission prompt](https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery) appears in context. In the default flow, render a `CastButton` and tap it; on subsequent launches the SDK manages discovery automatically. In a **custom device picker** flow (no `CastButton`), start discovery yourself by calling [startDiscovery](../api/classes/discoverymanager#startdiscovery), as Google recommends for custom pickers — the first call triggers the same permission prompt.

- (iOS) If you disabled discovery autostart in [iOS Setup](./setup#ios), make sure you call [startDiscovery](../api/classes/discoverymanager#startdiscovery) somewhere in your JS code.

- (iOS) Double check that you've configured Bonjour services in `Info.plist`.

- (iOS) If calling `showCastDialog`, note that discovery must have been started and local network permission granted before the dialog can list any devices. In the default flow that means the user has tapped the Cast Button at least once; in a custom-picker flow, calling [startDiscovery](../api/classes/discoverymanager#startdiscovery) first serves the same purpose.

- (iOS) You may want to set `options.startDiscoveryAfterFirstTapOnCastButton = false` if you're not explicitly requiring the user to tap the Cast Button first and instead want to start discovery immediately after launching the app.

## Other Issues

- ```
  java.lang.IllegalStateException
      at com.google.android.gms.cast.framework.CastContext.getSharedInstance(...)
  ```

  This logcat signature means the Cast SDK **failed to initialize its options provider**. v5 guards all first-touch paths, so the app doesn't crash — casting just reports `noDevicesAvailable`. Checklist:

  - The `com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME` meta-data exists in the **merged** manifest, inside `<application>` (see [Setup](./setup#android)).
  - Its value is the exact fully-qualified class name — `com.margelo.nitro.googlecast.NitroCastOptionsProvider`, or your own provider class (watch for typos and package renames).
  - A custom/subclassed provider is **kept by R8/ProGuard** in release builds — the class is instantiated reflectively, so it needs a keep rule (`-keep class com.example.MyOptionsProvider { <init>(); }`). The library ships the rule for its own provider only.
  - Your provider's `getCastOptions` doesn't throw — and doesn't call `CastContext.getSharedInstance()` (it is called *from inside* that initialization).

- ```
  com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.
  ```

  You don't have Google Play Services available on your device. Make sure to install them either from the [Play Store](<(https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US)>), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

- ```
  java.lang.IllegalStateException: The activity must be a subclass of FragmentActivity
  ```

  Make sure your `MainActivity` extends `ReactActivity`, `AppCompatActivity`, or some other descendant of `FragmentActivity`.

- ```
  .../react-native-google-cast/ios/RNGoogleCast/components/RNGoogleCastButtonManager.m:1:9: fatal error: 'React/RCTViewManager.h' file not found
  ```

  Select `React` from the Schemes and build it first (Cmd+B) before running your main project.

- ```
  duplicate symbol __ZN3fLB18FLAGS_nolog_prefixE in:
    /Users/user/Documents/Apps/test-rn/RNAwesomeProject/ios/Pods/google-cast-sdk/GoogleCastSDK-ios-4.3.1_static/GoogleCast.framework/GoogleCast(logging_f31ccd6e0091bd60840b95581a5633bf.o)
  ld: 7 duplicate symbols for architecture x86_64
  clang: error: linker command failed with exit code 1 (use -v to see invocation)
  ```

  This is caused by Google introducing a [dynamic SDK build in 4.3.1](https://issuetracker.google.com/issues/113069508). It seems to affects Google SDK versions 4.3.x - 4.4.x. Please upgrade to the latest SDK (4.5+) or use `react-native-google-cast/NoBluetooth`.

- ```
  building for iOS Simulator, but linking in object file built for iOS, file '.../ios/Pods/google-cast-sdk-no-bluetooth/GoogleCastSDK-ios-4.7.0_static/GoogleCast.framework/GoogleCast' for architecture arm64
  ```

  When building on M1/ARM Macs, you need to edit your `ios/Podfile` as described in [Installation](https://react-native-google-cast.github.io/docs/getting-started/installation.html#ios).

- Using `tools:node="replace"` in AndroidManifest may cause media to not load on the Cast device [#349](https://github.com/react-native-google-cast/react-native-google-cast/issues/349). See [firebase/quickstart-android#477](https://github.com/firebase/quickstart-android/issues/477) for options how to resolve this.

- ```
  > Task :app:compileReleaseKotlin FAILED
  e: Incompatible classes were found in dependencies. Remove them from the classpath or use '-Xskip-metadata-version-check' to suppress errors
  ```
  The latest version of Cast Framework isn't compatible with older Kotlin versions. Please update your `app/build.gradle` to use Kotlin 2.x or set `castFrameworkVersion = "22.0.0"` as described in [Installation](https://react-native-google-cast.github.io/docs/getting-started/installation.html#android). See [issue #570](https://github.com/react-native-google-cast/react-native-google-cast/issues/570#issuecomment-3101401245).

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

- If using a custom receiver application in the [Google Cast SDK Developer Console](https://cast.google.com/publish) that's Unpublished, make sure you register your device in the **Cast Receiver Devices**. Once you do that, you need to wait about 15 minutes and then restart your Cast device.

- Check the Debug log in Xcode or Android Studio for any warnings and errors.

- (Android) Make sure the device has Google Play Services available and that you initialize `CastContext.getSharedInstance(this);` in your `MainActivity`'s `onCreate`.

- (Android) **emulators** are [not supported](https://github.com/googlecast/CastVideos-android/issues/104#issuecomment-816290407). Please test with a real Android device before reporting an issue. Alternatively, you may try using [Genymotion](https://www.genymotion.com/) but note it [doesn't support M1/ARM Macs yet](https://support.genymotion.com/hc/en-us/articles/360017897157-Does-Genymotion-Desktop-work-on-Mac-M1-).

- (iOS) If you disabled discovery autostart in [iOS Setup](./setup#ios), make sure you call [startDiscovery](../api/classes/discoverymanager#startdiscovery) somewhere in your JS code.

- (iOS 14+) Double check that you've configured Bonjour services in `Info.plist`.

- (iOS 14+) If calling `showCastDialog`, note that the user has to tap the Cast Button and grant permissions first before you can programmatically open the dialog.

- (iOS 14+) You may want to set `options.startDiscoveryAfterFirstTapOnCastButton = false` if you're not explicitly requiring the user to tap the Cast Button first and instead want to start discovery immediately after launching the app.
-
- (iOS 12) Make sure you've enabled the **Access WiFi Information** capability.

## Other Issues

- ```
  com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.
  ```

  You don't have Google Play Services available on your device. Make sure to install them either from the [Play Store](<(https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US)>), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

- ```
  java.lang.IllegalStateException: The activity must be a subclass of FragmentActivity
  ```

  Make sure your `MainActivity` extends `GoogleCastActivity`, `AppCompatActivity`, or some other descendant of `FragmentActivity`.

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

- (Android) Using `tools:node="replace"` in AndroidManifest may cause media to not load on the Cast device [#349](https://github.com/react-native-google-cast/react-native-google-cast/issues/349). See [firebase/quickstart-android#477](https://github.com/firebase/quickstart-android/issues/477) for options how to resolve this.

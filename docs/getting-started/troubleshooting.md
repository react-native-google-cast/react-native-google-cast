---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
---

- Can't see any devices (the Cast Button doesn't show up and the `castState` is `noDevicesAvailable`):

  Check [Discovery Troubleshooting](https://developers.google.com/cast/docs/discovery) in the Google Cast documentation.

## Android

- ```
  com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.
  ```

  You don't have Google Play Services available on your device. Make sure to install them either from the [Play Store](<(https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US)>), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

  TODO: Handle gracefully and ignore the Cast library without crashing.

- ```
  java.lang.IllegalStateException: The activity must be a subclass of FragmentActivity
  ```

  Make sure your `MainActivity` extends `GoogleCastActivity`, `AppCompatActivity`, or some other descendant of `FragmentActivity`.

## iOS

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

- Cast button isn't displayed on an iOS device

  If developing using Xcode 10 and targeting iOS devices running iOS 12 or higher, enable the [**Access WiFi Information** capability](https://developers.google.com/cast/docs/ios_sender/#xcode_10). Note: "Wireless Accessory Configuration" is unrelated.

  Moreover, if you disabled discovery autostart in [iOS Setup](./setup#ios), make sure you call [startDiscovery](../api/classes/discoverymanager#startdiscovery) somewhere in your JS code.

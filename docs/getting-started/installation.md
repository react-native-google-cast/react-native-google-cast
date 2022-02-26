---
id: installation
title: Installation
sidebar_label: Installation
---

`$ npm install react-native-google-cast --save`

or

`$ yarn add react-native-google-cast`

## Expo

Since Expo SDK 42, you can use this library in a custom-built Expo app.

Simply follow instructions at [@config-plugins/react-native-google-cast](https://github.com/expo/config-plugins/tree/master/packages/react-native-google-cast) which will take care of all the installation and setup steps.

Then ignore the rest of this page and jump straight to [Usage](usage).

## iOS

If you're using RN >= 0.60 and you're fine with default settings (without guest mode), you can just run `cd ios && pod install`. Note that the latest Google Cast SDK (currently [4.7.0](https://developers.google.com/cast/docs/release-notes#november-19,-2021)) only supports iOS 12 or newer.

If you need to support iOS 10/11, or enable guest mode, read below.

#### Using CocoaPods (RN >= 0.60, or <= 0.59 with CocoaPods)

1. If you don't have [CocoaPods](https://cocoapods.org/) set up yet (RN <=0.59), follow instructions in the [react-native documentation](https://reactnative.dev/docs/integration-with-existing-apps#configuring-cocoapods-dependencies).

2. In your `ios/Podfile`, add **one** of these snippets:

   - If you [don't need guest mode](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#need_to_remove_guest_mode_support), add

     ```
     pod 'react-native-google-cast/NoBluetooth', path: '../node_modules/react-native-google-cast/ios/'
     pod 'google-cast-sdk-no-bluetooth'
     # or for iOS 10/11 support
     # pod 'google-cast-sdk-no-bluetooth', '4.6.1'
     ```

   - If you [want to support guest mode](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#need_to_keep_guest_mode_support), add

     ```
     pod 'react-native-google-cast/GuestMode', path: '../node_modules/react-native-google-cast/ios/'
     pod 'google-cast-sdk'
     # or for iOS 10/11 support
     # pod 'google-cast-sdk', '4.6.1'
     ```

     To finish setting up guest mode, don't forget step 5 in the [Setup](setup#ios).

   - If you want to link the Google Cast SDK manually, add this and follow [Manual Setup](https://developers.google.com/cast/docs/ios_sender#manual_setup)

     ```
     pod 'react-native-google-cast/Manual', path: '../node_modules/react-native-google-cast/ios/'
     ```

3. If you're using RN >= 0.60, and your `ios/Podfile` contains `use_native_modules!`, you'll need to disable autolinking for this package, otherwise the dependency you added in the previous step will conflict with the autolinked one. To do so, create `react-native.config.js` in the root of your project with this content:

   ```js
   module.exports = {
     dependencies: {
       'react-native-google-cast': {
         platforms: {
           ios: null, // this will disable autolinking for this package on iOS
         },
       },
     },
   }
   ```

4. Finally, run `pod install`.

#### Manually (RN <=0.59)

- In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`

- Go to `node_modules` ➜ `react-native-google-cast` and add `RNGoogleCast.xcodeproj`

- In XCode, in the project navigator, select your project. Add `libRNGoogleCast.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`

- Follow the [instructions](https://developers.google.com/cast/docs/ios_sender/#google_cast_sdk) to install the Google Cast SDK

## Android

Insert the following into `android/app/build.gradle`:

```java
dependencies {
  // ...
  implementation "com.google.android.gms:play-services-cast-framework:${safeExtGet('castFrameworkVersion', '+')}"
}

def safeExtGet(prop, fallback) {
  rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}
```

By default, the latest version (`+`) of the Cast SDK is used. To use a specific version, set it in the root `android/build.gradle`:

```java
buildscript {
  ext {
    buildToolsVersion = "31.0.0"
    minSdkVersion = 16
    compileSdkVersion = 31
    targetSdkVersion = 31
    supportLibVersion = "31.0.0"
    castFrameworkVersion = "21.0.0" // <-- Cast SDK version
  }
}
```

#### RN >= 0.60

No additional setup needed thanks to autolinking.

#### RN <= 0.59

1. Open up `android/app/src/main/java/[...]/MainApplication.java`

   - Add `import com.reactnative.googlecast.GoogleCastPackage;` to the imports at the top of the file
   - Add `new GoogleCastPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:

   ```java
   include ':react-native-google-cast'
   project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-google-cast/android')
   ```

3. Insert the following line inside the `dependencies` block in `android/app/build.gradle` (in addition to the `play-service-cast-framework` from above):

   ```java
   dependencies {
     ...
     implementation project(':react-native-google-cast')
   }
   ```

## Chrome

Not supported yet

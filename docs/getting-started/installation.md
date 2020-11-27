---
id: installation
title: Installation
sidebar_label: Installation
---

`$ npm install react-native-google-cast@next --save`

or

`$ yarn add react-native-google-cast@next`

## Link package (React Native >=0.60)

Android is linked automatically.

For iOS, run:

```
cd ios && pod install
```

That's it. Continue to [Setup](setup.html).

## Link package (React Native <=0.59)

`$ react-native link react-native-google-cast`

Note: This will only link the react-native-google-cast library. You'll still need to add Google Cast SDK using the steps below.

### iOS

#### Using CocoaPods

Install [CocoaPods](https://cocoapods.org/) and set up your Podfile like it is described in the [react-native documentation](https://facebook.github.io/react-native/docs/integration-with-existing-apps#configuring-cocoapods-dependencies).

In your `ios/Podfile`, add **one** of these snippets:

- If targeting iOS <=12, or iOS 13+ and you [require guest mode](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#need_to_keep_guest_mode_support), add

  ```
  pod 'react-native-google-cast', path: '../node_modules/react-native-google-cast/ios/'
  # pod 'google-cast-sdk', '4.5.0' <-- optional, will default to the latest version if not specified
  ```

- If targeting iOS 13+ and you [don't need guest mode](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#need_to_remove_guest_mode_support), add

  ```
  pod 'react-native-google-cast/NoBluetooth', path: '../node_modules/react-native-google-cast/ios/'
  # pod 'google-cast-sdk-no-bluetooth', '4.5.0' <-- optional, will default to the latest version if not specified
  ```

- If you want to link the Google Cast SDK manually, add

  ```
  pod 'react-native-google-cast/Manual', path: '../node_modules/react-native-google-cast/ios/'
  ```

  and follow [Manual Setup](https://developers.google.com/cast/docs/ios_sender#manual_setup).

Finally, run `pod install`.

#### Manually

- In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`

- Go to `node_modules` ➜ `react-native-google-cast` and add `RNGoogleCast.xcodeproj`

- In XCode, in the project navigator, select your project. Add `libRNGoogleCast.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`

- Follow the [instructions](https://developers.google.com/cast/docs/ios_sender/#google_cast_sdk) to install the Google Cast SDK

### Android

1. Open up `android/app/src/main/java/[...]/MainApplication.java`

   - Add `import com.reactnative.googlecast.GoogleCastPackage;` to the imports at the top of the file
   - Add `new GoogleCastPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:

   ```java
   include ':react-native-google-cast'
   project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-google-cast/android')
   ```

3. Insert the following lines inside the `dependencies` block in `android/app/build.gradle`:

   ```java
   dependencies {
     ...

     implementation project(':react-native-google-cast')

     implementation "com.google.android.gms:play-services-cast-framework:${safeExtGet('castFrameworkVersion', '+')}"
   }

   // you also need to have this helper defined
   def safeExtGet(prop, fallback) {
     rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
   }
   ```

4. By default, the react-native-google-cast package automatically loads the latest version (`+`) of the Cast SDK and support libraries as its dependencies. To use a specific version, set it in the root `android/build.gradle`:

   ```java
   buildscript {
     ext {
       buildToolsVersion = "29.0.2"
       minSdkVersion = 16
       compileSdkVersion = 29
       targetSdkVersion = 29
       supportLibVersion = "29.0.0"
       castFrameworkVersion = "19.0.0" // <-- Cast SDK version
     }
   }
   ```

### Chrome

Not supported yet

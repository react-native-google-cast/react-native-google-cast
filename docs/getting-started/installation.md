---
id: installation
title: Installation
sidebar_label: Installation
---

`$ npm install react-native-google-cast --save`

or

`$ yarn add react-native-google-cast`

## Link package

`$ react-native link react-native-google-cast`

Note: This will only link the react-native-google-cast library. You'll still need to add Google Cast SDK using the steps below.

### iOS (CocoaPods)

- Install [CocoaPods](https://cocoapods.org/)

- Setup your Podfile like it is described in the [react-native documentation](https://facebook.github.io/react-native/docs/integration-with-existing-apps#configuring-cocoapods-dependencies).

- Add `pod 'google-cast-sdk', '4.3.0'` to your `Podfile`. (⚠️ Make sure you're using Google Cast SDK version `4.3.0` until the [duplicate symbol issue](https://issuetracker.google.com/issues/113069508) is fixed)

- Add `pod 'react-native-google-cast', path: '../node_modules/react-native-google-cast/ios/'` to your `Podfile`

- Run `pod install`

### iOS (Manually)

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
       buildToolsVersion = "27.0.3"
       minSdkVersion = 16
       compileSdkVersion = 27
       targetSdkVersion = 26
       supportLibVersion = "26.1.0"
       castFrameworkVersion = '16.1.2' // <-- Cast SDK version
     }
   }
   ```

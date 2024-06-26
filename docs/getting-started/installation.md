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

If you're unsure please check the [example Expo app](https://github.com/react-native-google-cast/RNGCExpo).

## iOS

Thanks to autolinking, the package and its Google Cast SDK dependency are automatically installed when you run `pod install`.

> The latest Google Cast SDK (currently [4.8.1](https://developers.google.com/cast/docs/release-notes#april-18,-2024)) only supports iOS 14 or newer. If you need to support older iOS versions, use an older version of the library but note that some features might not be available.

> Before v4.8.1, Google Cast used to publish different variants of the SDK based on whether they included Guest Mode support. That feature has been removed in the latest versions so now there's only a single SDK variant.

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
    buildToolsVersion = "34.0.0"
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    castFrameworkVersion = "21.4.0" // <-- Cast SDK version
  }
}
```

## Chrome

Not supported yet

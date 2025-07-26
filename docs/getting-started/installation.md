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
There is a config plugin included to auto-configure `react-native-google-cast` when the native code is generated (`npx expo prebuild`).

> This package cannot be used in **Expo Go** because [it requires custom native code](https://docs.expo.dev/workflow/continuous-native-generation/). You need to build a standalone app instead.

Add the [config plugin](https://docs.expo.dev/guides/config-plugins/) to the [`plugins`](https://docs.expo.dev/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js/ts`:

```json
{
  "expo": {
    "plugins": ["react-native-google-cast"]
  }
}
```

Next, rebuild your app as described in the ["Adding custom native code"](https://docs.expo.dev/workflow/continuous-native-generation/) guide.

Then ignore the rest of this page and continue to [Setup](setup#expo).

## iOS

Thanks to autolinking, the package and its Google Cast SDK dependency are automatically installed when you run `pod install`.

> The latest Google Cast SDK (currently [4.8.3](https://developers.google.com/cast/docs/release-notes#august-22,-2024)) requires iOS 14 or newer. However, React Native 0.76+ already requires iOS 15.1 or higher. If you need to support older iOS versions, use an older version of the library but note that some features might not be available.

> Before v4.8.1, Google Cast used to publish different variants of the SDK based on whether they included Guest Mode support. That feature has been removed in the latest versions so now there's only a single SDK variant.

## Android

The react-native-google-cast library is autolinked but we need to add the Google Cast SDK dependency to `android/app/build.gradle`:

```java
dependencies {
  // ...
  implementation "com.google.android.gms:play-services-cast-framework:+"
}
```

By default, the latest version (`+`) of the Cast SDK is used.

> To use a specific version, add `castFrameworkVersion` in the root `android/build.gradle`:
>
> ```java
> buildscript {
>   ext {
>     buildToolsVersion = "34.0.0"
>     minSdkVersion = 22
>     compileSdkVersion = 34
>     targetSdkVersion = 34
>     castFrameworkVersion = "22.1.0" // <-- Cast SDK version
>   }
> }
> ```
>
> and update `android/app/build.gradle`:
>
> ```java
> dependencies {
>   // ...
>   implementation "com.google.android.gms:play-services-cast-framework:${safeExtGet('castFrameworkVersion', '+')}"
> }
>
> def safeExtGet(prop, fallback) {
>   rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
> }
> ```

## Chrome

Not supported yet

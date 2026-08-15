---
id: installation
title: Installation
sidebar_label: Installation
---

`$ npm install react-native-google-cast react-native-nitro-modules --save`

or

`$ yarn add react-native-google-cast react-native-nitro-modules`

> v5 requires **React Native 0.78+ with the New Architecture enabled** and the
> [`react-native-nitro-modules`](https://nitro.margelo.com) peer dependency shown
> above. While v5 is in beta, install it with the `next` tag:
> `npm install react-native-google-cast@next`. Upgrading from v4? Read the
> [migration guide](../guides/migrating-v4-to-v5).

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

The react-native-google-cast library is autolinked and already depends on the Google Cast SDK (`play-services-cast-framework`), so no gradle changes are needed.

> To use a specific Cast SDK version, add `castFrameworkVersion` in the root `android/build.gradle` — the library picks it up automatically:
>
> ```java
> buildscript {
>   ext {
>     // ...
>     castFrameworkVersion = "22.1.0" // <-- Cast SDK version
>   }
> }
> ```
>
> Versions below `21.3.0` are strongly discouraged — see the [Notifications guide](../guides/notifications#cast-framework-version-floor--2130).

## Chrome

Not supported yet

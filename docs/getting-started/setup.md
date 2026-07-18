---
id: setup
title: Setup
sidebar_label: Setup
---

## Expo

If you're using Expo, you can configure your build using the included plugin (see below) and then continue to [Usage](usage).

The plugin provides props for extra customization. Every time you change the props or plugins, you'll need to rebuild (and `prebuild`) the native app. If no extra properties are added, defaults will be used.

- `receiverAppId` (_string_): custom receiver app id. Default `CC1AD845` (default receiver provided by Google). Sets both `iosReceiverAppId` and `androidReceiverAppId`.
- `expandedController` (_boolean_): Whether to use the default expanded controller. Default `true`. **iOS-only effect** (`useDefaultExpandedMediaControls`) — on Android the expanded controller is automatic in v5 (registered by the library manifest).
- `androidReceiverAppId` (_string_): custom receiver app id. Default `CC1AD845`. Written to the `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` meta-data.
- `androidOptionsProvider` (_string_): fully-qualified class name of a custom Android `OptionsProvider`, written to the `OPTIONS_PROVIDER_CLASS_NAME` meta-data. Default `com.margelo.nitro.googlecast.NitroCastOptionsProvider` (the library provider).
- `androidNotificationsEnabled` (_boolean_): whether the library provider shows media notifications (and lock-screen controls) during a session. Default `true`. Setting `false` writes the `com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED` meta-data. See the [Notifications guide](../guides/notifications).
- `androidPlayServicesCastFrameworkVersion` (_string_): Version for the Android Cast SDK. Default `+` (latest). Pinning a version below `21.3.0` triggers a prebuild warning — older versions post notifications from a foreground service, the Android 14+ crash class of [#447](https://github.com/react-native-google-cast/react-native-google-cast/issues/447)/[#527](https://github.com/react-native-google-cast/react-native-google-cast/issues/527).
- `iosReceiverAppId` (_string_): custom receiver app id. Default `CC1AD845`.
- `iosDisableDiscoveryAutostart` (_boolean_): Whether the discovery of Cast devices should not start automatically at context initialization time. Default `false`. if set to `true`, you'll need to start it later by calling [DiscoveryManager.startDiscovery](../api/classes/discoverymanager#startdiscovery).
- `iosStartDiscoveryAfterFirstTapOnCastButton` (_boolean_): Whether cast devices discovery start only after a user taps on the Cast button for the first time. Default `true`. If set to `false`, discovery will start as soon as the SDK is initialized. Note that this will ask the user for network permissions immediately when the app is opened for the first time.
- `iosSuspendSessionsWhenBackgrounded` (_boolean_): Whether sessions should be suspended when the sender application goes into the background (and resumed when it returns to the foreground). Default `true`. It is appropriate to set this to `false` in applications that are able to maintain network connections indefinitely while in the background.
- `iosSkipAppDelegateInit` (_boolean_): skip the AppDelegate `GCKCastContext` init injection entirely, for apps that need fully custom `GCKCastOptions`. Default `false`. Info.plist wiring (Bonjour services, local-network usage description) still applies. The plugin also raises a descriptive prebuild error if your AppDelegate already initializes `GCKCastContext` manually — either remove the manual init (the plugin owns it) or set this prop to `true`.

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-cast",
        {
          "receiverAppId": "...",
          "iosStartDiscoveryAfterFirstTapOnCastButton": false
        }
      ]
    ]
  }
}
```

### How the Android props interplay

`receiverAppId` / `androidReceiverAppId` and `androidNotificationsEnabled` are **meta-data writers**: they emit manifest `<meta-data>` entries that are *consumed by `NitroCastOptionsProvider`* (or by subclasses that call `super`). If you point `androidOptionsProvider` at a from-scratch `OptionsProvider` that doesn't read these keys, those props have no effect — your provider is the source of truth.

## iOS

1. In `AppDelegate.swift` (or `AppDelegate.mm`) add

  <!--DOCUSAURUS_CODE_TABS-->
  <!--Swift-->

  ```swift
  // 1.1. add import at the top
  import GoogleCast

  class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
      _ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
      // ...
      // 1.2. add inside application:didFinishLaunchingWithOptions
      let receiverAppID = kGCKDefaultMediaReceiverApplicationID // or "ABCD1234"
      let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)
      let options = GCKCastOptions(discoveryCriteria: criteria)
      GCKCastContext.setSharedInstanceWith(options)
      // ...
    }
    // ...
  }
  ```

  <!--Objective-C-->

  ```obj-c
  // 1.1. add import at the top
  #import <GoogleCast/GoogleCast.h>

  @implementation AppDelegate
    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
    {
      // ...
      // 1.2. add inside application didFinishLaunchingWithOptions
      NSString *receiverAppID = kGCKDefaultMediaReceiverApplicationID; // or @"ABCD1234"
      GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:receiverAppID];
      GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
      [GCKCastContext setSharedInstanceWithOptions:options];
      // ...
    }
    // ...
  }
  ```

  <!--END_DOCUSAURUS_CODE_TABS-->

   If using a [custom web receiver](https://developers.google.com/cast/docs/web_receiver), replace `kGCKDefaultMediaReceiverApplicationID` with your receiver app id.

2. You need to add [local network permissions](https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery) to `Info.plist`:

   ```xml
   <key>NSBonjourServices</key>
   <array>
     <string>_googlecast._tcp</string>
     <string>_CC1AD845._googlecast._tcp</string>
   </array>
   <key>NSLocalNetworkUsageDescription</key>
   <string>${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.</string>
   ```

   If using a custom receiver, make sure to replace `CC1AD845` with your custom receiver app id.

   You may also customize the local network usage description (See [#355](https://github.com/react-native-google-cast/react-native-google-cast/issues/355#issuecomment-906520304)).

   Furthermore, a dialog asking the user for the local network permission will now be displayed immediately when the app is opened.

3. (optional) By default, Cast device discovery is initiated when the user taps the Cast button. If it's the first time, the local network access interstitial will appear, followed by the iOS Local Network Access permissions dialog.

   You may [customize this behavior](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#customizations) in `AppDelegate.m` by either:

   - setting [`disableDiscoveryAutostart`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a6cfeb6f96487fd0e1fc68c31928d3e3d) to `true`:

     ```obj-c
     options.disableDiscoveryAutostart = true
     ```

     > Note: If you disable discovery autostart, you'll need to start it later by calling [startDiscovery](../api/classes/discoverymanager#startdiscovery).

   - or setting [`startDiscoveryAfterFirstTapOnCastButton`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a1e701e7d1852d1e09ec2aee936b46413) to `false`. In this case, discovery will start as soon as the SDK is initialized.

     ```obj-c
     options.startDiscoveryAfterFirstTapOnCastButton = false
     ```

## Android

Add to `AndroidManifest.xml` (in `android/app/src/main`), inside `<application>`:

```xml
<application ...>
  ...
  <meta-data
    android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
    android:value="com.margelo.nitro.googlecast.NitroCastOptionsProvider" />
</application>
```

Additionally, if you're using a custom receiver, also add (replace `ABCD1234` with your receiver app id):

```xml
  <meta-data
    android:name="com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID"
    android:value="ABCD1234" />
```

When the receiver meta-data is absent (or blank), the library falls back to the Default Media Receiver (`CC1AD845`).

To disable media notifications and lock-screen controls, add (see the [Notifications guide](../guides/notifications)):

```xml
  <meta-data
    android:name="com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED"
    android:value="false" />
```

That's it — unlike v4, v5 requires **no `MainActivity` changes** (the Cast context is initialized lazily by the library) and **no expanded-controller `<activity>`** (it ships pre-registered in the library manifest).

> The Cast framework requires Google Play Services to be available on your device. If your device doesn't have them by default, you can install them either from the [Play Store](https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

### Custom `OptionsProvider`

The library's `NitroCastOptionsProvider` wires the receiver app id, media notifications, the default [image picker](../guides/customize-ui), and the expanded controller. If you need to customize one of those concerns, **subclass it and override the seam(s) you need** — each is independent, so overriding one leaves the others at their library defaults:

- `getReceiverApplicationId(context)` — the receiver app id (default: meta-data, falling back to `CC1AD845`),
- `getNotificationOptions(context)` — the `NotificationOptions` (return `null` to disable notifications; override to customize actions),
- `getImagePicker()` — the artwork selection heuristic.

```kotlin
package com.example

import android.content.Context
import com.google.android.gms.cast.framework.media.NotificationOptions
import com.margelo.nitro.googlecast.NitroCastOptionsProvider

class MyOptionsProvider : NitroCastOptionsProvider() {
  override fun getNotificationOptions(context: Context): NotificationOptions? {
    // customize actions here; return null to disable notifications
    return super.getNotificationOptions(context)
  }
}
```

Then point the manifest (or the `androidOptionsProvider` Expo prop) at your class:

```xml
<meta-data
  android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
  android:value="com.example.MyOptionsProvider" />
```

Alternatively, write a from-scratch [`OptionsProvider`](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/OptionsProvider) — the escape hatch for fully custom `CastOptions`. Note that a from-scratch provider ignores the library meta-data (receiver id, notifications toggle) unless you read it yourself, and don't call `CastContext.getSharedInstance()` inside `getCastOptions` (it's called *during* that initialization).

> **R8/ProGuard:** the provider class is instantiated reflectively via the `OPTIONS_PROVIDER_CLASS_NAME` meta-data, which is invisible to R8. The library ships a consumer keep rule for `NitroCastOptionsProvider`, but a **custom or subclassed provider needs your own keep rule** in `proguard-rules.pro`:
>
> ```
> -keep class com.example.MyOptionsProvider { <init>(); }
> ```

## Chrome

Not supported yet

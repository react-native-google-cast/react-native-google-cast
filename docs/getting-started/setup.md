---
id: setup
title: Setup
sidebar_label: Setup
---

## Expo

If you're using Expo, you can configure your build using the included plugin (see below) and then continue to [Usage](usage).

The plugin provides props for extra customization. Every time you change the props or plugins, you'll need to rebuild (and `prebuild`) the native app. If no extra properties are added, defaults will be used.

- `receiverAppId` (_string_): custom receiver app id. Default `CC1AD845` (default receiver provided by Google). Sets both `iosReceiverAppId` and `androidReceiverAppId`.
- `expandedController` (_boolean_): Whether to use the default expanded controller. Default `true`.
- `androidReceiverAppId` (_string_): custom receiver app id. Default `CC1AD845`.
- `androidPlayServicesCastFrameworkVersion` (_string_): Version for the Android Cast SDK. Default `+` (latest).
- `iosReceiverAppId` (_string_): custom receiver app id. Default `CC1AD845`.
- `iosDisableDiscoveryAutostart` (_boolean_): Whether the discovery of Cast devices should not start automatically at context initialization time. Default `false`. if set to `true`, you'll need to start it later by calling [DiscoveryManager.startDiscovery](../api/classes/discoverymanager#startdiscovery).
- `iosStartDiscoveryAfterFirstTapOnCastButton` (_boolean_): Whether cast devices discovery start only after a user taps on the Cast button for the first time. Default `true`. If set to `false`, discovery will start as soon as the SDK is initialized. Note that this will ask the user for network permissions immediately when the app is opened for the first time.
- `iosSuspendSessionsWhenBackgrounded` (_boolean_): Whether sessions should be suspended when the sender application goes into the background (and resumed when it returns to the foreground). Default `true`. It is appropriate to set this to `false` in applications that are able to maintain network connections indefinitely while in the background.

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

1. Add to `AndroidManifest.xml` (in `android/app/src/main`):

   ```xml
   <application ...>
     ...
     <meta-data
       android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
       android:value="com.reactnative.googlecast.GoogleCastOptionsProvider" />
   </application>
   ```

   Additionally, if you're using a custom receiver, also add (replace `ABCD1234` with your receiver app id):

   ```xml
     <meta-data
       android:name="com.reactnative.googlecast.RECEIVER_APPLICATION_ID"
       android:value="ABCD1234" />
   ```

   Alternatively, you may provide your own `OptionsProvider` class. See `GoogleCastOptionsProvider.java` for inspiration.

2. In your `MainActivity.kt` or `MainActivity.java`, initialize CastContext by overriding the `onCreate` method.

  <!--DOCUSAURUS_CODE_TABS-->
  <!--Kotlin-->

  ```kt
  import android.os.Bundle
  import androidx.annotation.Nullable
  import com.reactnative.googlecast.api.RNGCCastContext

  class MainActivity : ReactActivity() {
    // ...

    override fun onCreate(@Nullable savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)

      // lazy load Google Cast context (if supported on this device)
      RNGCCastContext.getSharedInstance(this)
    }
  }
  ```

  <!--Java-->

  ```java
  // ...
  import android.os.Bundle;
  import androidx.annotation.Nullable;
  import com.reactnative.googlecast.api.RNGCCastContext;

  public class MainActivity extends ReactActivity {
    // ...

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);

      // lazy load Google Cast context (if supported on this device)
      RNGCCastContext.getSharedInstance(this);
    }
  }
  ```

  <!--END_DOCUSAURUS_CODE_TABS-->

   This works if you're extending `ReactActivity` (or `NavigationActivity` if you're using react-native-navigation). If you're extending a different activity, make sure it is a descendant of `androidx.appcompat.app.AppCompatActivity`.

   > The Cast framework requires Google Play Services to be available on your device. If your device doesn't have them by default, you can install them either from the [Play Store](<(https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US)>), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

## Chrome

Not supported yet

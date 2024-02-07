---
id: setup
title: Setup
sidebar_label: Setup
---

## Expo

If you're using Expo, follow instructions at [@config-plugins/react-native-google-cast](https://github.com/expo/config-plugins/tree/master/packages/react-native-google-cast) and then continue to [Usage](usage).

## iOS

1. In `AppDelegate.m` (or `AppDelegate.swift`) add

<!--DOCUSAURUS_CODE_TABS-->
<!--Objective-C-->

```obj-c
#import <GoogleCast/GoogleCast.h>
```

<!--Swift-->

```swift
import GoogleCast
```

<!--END_DOCUSAURUS_CODE_TABS-->

and insert the following in the `application:didFinishLaunchingWithOptions` method, ideally at the beginning (or right after Flipper initialization):

<!--DOCUSAURUS_CODE_TABS-->
<!--Objective-C-->

```obj-c
NSString *receiverAppID = kGCKDefaultMediaReceiverApplicationID; // or @"ABCD1234"
GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:receiverAppID];
GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
[GCKCastContext setSharedInstanceWithOptions:options];
```

<!--Swift-->

```swift
let receiverAppID = kGCKDefaultMediaReceiverApplicationID // or "ABCD1234"
let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)
let options = GCKCastOptions(discoveryCriteria: criteria)
GCKCastContext.setSharedInstanceWith(options)
```

<!--END_DOCUSAURUS_CODE_TABS-->

If using a custom receiver, replace `kGCKDefaultMediaReceiverApplicationID` with your receiver app id.

1. For iOS 14+, you need to add [local network permissions](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#updating_your_app_on_ios_14) to `Info.plist`:

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

2. (Optional iOS 14+) By default, Cast device discovery is initiated when the user taps the Cast button. If it's the first time, the local network access interstitial will appear, followed by the iOS Local Network Access permissions dialog.

   You may [customize this behavior](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#customizations) in `AppDelegate.m` by either:

   - setting [`disableDiscoveryAutostart`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a6cfeb6f96487fd0e1fc68c31928d3e3d) to `true`:

     ```obj-c
     options.disableDiscoveryAutostart = true
     ```

     > Note: If you disable discovery autostart, you'll need to start it later by calling [startDiscovery](../api/classes/discoverymanager#startdiscovery).

   - or setting [`startDiscoveryAfterFirstTapOnCastButton`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a1e701e7d1852d1e09ec2aee936b46413) to `false` (only available on Google Cast iOS SDK 4.5.3+). In this case, discovery will start as soon as the SDK is initialized.

     ```obj-c
     options.startDiscoveryAfterFirstTapOnCastButton = false
     ```

3. If using iOS 13+ and you need [guest mode support](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#ios_13), add

   ```xml
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices.</string>
   <key>NSBluetoothPeripheralUsageDescription</key>
   <string>${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices.</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>${PRODUCT_NAME} uses microphone access to listen for ultrasonic tokens
   when pairing with nearby Cast devices.</string>
   ```

   Also make sure you've installed guest mode in step 2 of the [Installation](installation#ios).

   The [official Guest Mode documentation](https://developers.google.com/cast/docs/guest_mode) explains how guest mode works. Note that most use cases work fine without guest mode so you may decide you don't need it if it's not worth asking for the extra privacy permissions.

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

2. In your `MainActivity.java`, initialize CastContext by overriding the `onCreate` method.

   ```java
   // ...
   import android.os.Bundle;
   import androidx.annotation.Nullable;
   import com.google.android.gms.cast.framework.CastContext;

   public class MainActivity extends ReactActivity {
     // ...

     @Override
     protected void onCreate(@Nullable Bundle savedInstanceState) {
       super.onCreate(savedInstanceState);

       try {
         // lazy load Google Cast context
         CastContext.getSharedInstance(this);
       } catch (Exception e) {
         // cast framework not supported
       }
     }
   }
   ```

   This works if you're extending `ReactActivity` (or `NavigationActivity` if you're using react-native-navigation). If you're extending a different activity, make sure it is a descendant of `androidx.appcompat.app.AppCompatActivity`.

   > The Cast framework requires Google Play Services to be available on your device. If your device doesn't have them by default, you can install them either from the [Play Store](<(https://play.google.com/store/apps/details?id=com.google.android.gms&hl=en_US&gl=US)>), from [OpenGApps](http://opengapps.org/) or follow tutorials online.

## Chrome

Not supported yet

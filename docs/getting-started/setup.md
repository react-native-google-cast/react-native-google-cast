---
id: setup
title: Setup
sidebar_label: Setup
---

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

2. In Xcode, go to `Signing & Capabilities`, click `+ Capability` and select `Access WiFi Information`. (This is required since [iOS 12](https://developers.google.com/cast/docs/ios_sender/#ios_12).) Note that "Wireless Accessory Configuration" is unrelated.

3. For iOS 14+, you need to add [local network permissions](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#updating_your_app_on_ios_14) to `Info.plist`:

   ```xml
   <key>NSBonjourServices</key>
   <array>
     <string>_googlecast._tcp</string>
     <string>_ABCD1234._googlecast._tcp</string>
   </array>
   <key>NSLocalNetworkUsageDescription</key>
   <string>${APP_DISPLAY_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.</string>
   ```

   Make sure to replace `ABCD1234` with your receiver app id. If using the default receiver, you may delete that line.

   You may also customize the local network usage description.

   Furthermore, a dialog asking the user for the local network permission will now be displayed immediately when the app is opened.

4. (Optional iOS 14+) By default, Cast device discovery is initiated when the user taps the Cast button. If it's the first time, the local network access interstitial will appear, followed by the iOS Local Network Access permissions dialog.

   You may [customize this behavior](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#customizations) in `AppDelegate.m` by either:

   - setting [`disableDiscoveryAutostart`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a6cfeb6f96487fd0e1fc68c31928d3e3d) to `true`:

     ```obj-c
     options.disableDiscoveryAutostart = true
     ```

     > Note: If you disable discovery autostart, you'll need to start it later by calling [startDiscovery](../api/classes/discoverymanager#startdiscovery).

   - or setting [`startDiscoveryAfterFirstTapOnCastButton`](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_options#a1e701e7d1852d1e09ec2aee936b46413) to `false` (only available on Google Cast iOS SDK 4.5.3+). In this case, discovery will start as soon as the SDK is initialized.

     ```swift
     options.startDiscoveryAfterFirstTapOnCastButton = false
     ```

5. If using iOS 13+ and you need [guest mode support](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#ios_13), add

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

       // lazy load Google Cast context
       CastContext.getSharedInstance(this);
     }
   }
   ```

   This works if you're extending `ReactActivity` (or `NavigationActivity` if you're using react-native-navigation). If you're extending a different activity, make sure it is a descendant of `androidx.appcompat.app.AppCompatActivity`.

## Chrome

Not supported yet

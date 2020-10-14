---
id: setup
title: Setup
sidebar_label: Setup
---

## iOS

1. ⚠️ If developing using Xcode 10+ and targeting iOS devices running iOS 12+, enable the [**Access WiFi Information** capability](https://developers.google.com/cast/docs/ios_sender/#xcode_10). Note that "Wireless Accessory Configuration" is unrelated.

2. In `AppDelegate.m` add

   ```obj-c
   #import <GoogleCast/GoogleCast.h>
   ```

   and in the `didFinishLaunchingWithOptions` method add, ideally at the beginning (or right after Flipper initialization):

   ```obj-c
   GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:kGCKDefaultMediaReceiverApplicationID];
   GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
   [GCKCastContext setSharedInstanceWithOptions:options];
   ```

   If using a custom receiver, replace `kGCKDefaultMediaReceiverApplicationID` with your receiver app id.

3. If using iOS 13+ and you need [guest mode support](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#need_to_keep_guest_mode_support), add

   ```xml
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices.</string>
   <key>NSBluetoothPeripheralUsageDescription</key>
   <string>${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices.</string>
   <key>NSMicrophoneUsageDescription</key>
   <string>${PRODUCT_NAME} uses microphone access to listen for ultrasonic tokens
   when pairing with nearby Cast devices.</string>
   ```

   The [official Guest Mode documentation](https://developers.google.com/cast/docs/guest_mode) explains how guest mode works. Note that most use cases work fine without guest mode so you may decide you don't need it if it's not worth asking for the extra privacy permissions.

4. For iOS 14+, you also need to add [local network permissions](https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#updating_your_app_on_ios_14) to `Info.plist`:

   ```xml
   <key>NSBonjourServices</key>
   <array>
     <string>_googlecast._tcp</string>
     <string>_ABCD1234._googlecast._tcp</string>
   </array>
   <key>NSLocalNetworkUsageDescription</key>
   <string>${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.</string>
   ```

   Make sure to replace `ABCD1234` with your receiver app id. If using the default receiver, you may delete that row.

   You may also customize the local network usage description.

   Furthermore, a dialog asking the user for the local network permission will now be displayed immediately when the app is opened. If you want to wait before showing the dialog until the user taps the Cast button, disable autostart in `AppDelegate.m`:

   ```obj-c
   options.disableDiscoveryAutostart = true;
   # insert before [GCKCastContext setSharedInstanceWithOptions:options];
   ```

## Android

1. Make sure the device you're using (also applies to emulators) has Google Play Services installed.

2. Add to `AndroidManifest.xml`

   ```xml
   <application ...>
     ...
     <meta-data
       android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
       android:value="com.reactnative.googlecast.GoogleCastOptionsProvider" />
   </application>
   ```

   Alternatively, you may provide your own `OptionsProvider` class. For example, to use a custom receiver app:

   ```java
   // assuming this is in package com.foo
   package com.foo;

   import com.reactnative.googlecast.GoogleCastOptionsProvider;

   public class CastOptionsProvider extends GoogleCastOptionsProvider {
     @Override
     public CastOptions getCastOptions(Context context) {
       CastOptions castOptions = new CastOptions.Builder()
           .setReceiverApplicationId(context.getString(R.string.app_id))
           .build();
       return castOptions;
     }
   }
   ```

   and don't forget to set your `AndroidManifest.xml`:

   ```xml
   <meta-data
     android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
     android:value="com.foo.GoogleCastOptionsProvider" />
   ```

3. ⚠️ In your `MainActivity`, initialize CastContext by overriding the `onCreate` method.

   ```java
   ...
   import android.os.Bundle;
   import androidx.annotation.Nullable;
   import com.google.android.gms.cast.framework.CastContext;

   public class MainActivity extends ReactActivity {
     @Override
     protected void onCreate(@Nullable Bundle savedInstanceState) {
       super.onCreate(savedInstanceState);

       // lazy load Google Cast context
       CastContext.getSharedInstance(this);
     }

     ...
   }
   ```

   This works if you're extending `ReactActivity` (or `NavigationActivity` if you're using react-native-navigation). If you're extending a different activity, make sure it is a descendant of `androidx.appcompat.app.AppCompatActivity`.

## Chrome

Not supported yet

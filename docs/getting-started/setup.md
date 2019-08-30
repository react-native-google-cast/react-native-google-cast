---
id: setup
title: Setup
sidebar_label: Setup
---

## iOS

- ⚠️ If developing using Xcode 10 and targeting iOS devices running iOS 12 or higher, enable the [**Access WiFi Information** capability](https://developers.google.com/cast/docs/ios_sender/#xcode_10). Note: "Wireless Accessory Configuration" is unrelated. You need to be a member of the Apple Developer Program to see the "Access WiFi Information" setting.

- In `AppDelegate.m` add

  ```obj-c
  #import <GoogleCast/GoogleCast.h>
  ```

  and in the `didFinishLaunchingWithOptions` method add:

  ```obj-c
  GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:kGCKDefaultMediaReceiverApplicationID];
  GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

  (or replace `kGCKDefaultMediaReceiverApplicationID` with your custom receiver app id).

## Android

- Make sure the device you're using (also applies to emulators) has Google Play Services installed.

- Add to `AndroidManifest.xml`

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

- ⚠️ In your `MainActivity`, initialize CastContext by overriding the `onCreate` method.

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

---
id: setup
title: Setup
sidebar_label: Setup
---

## iOS

- Follow [iOS Setup Guide](https://developers.google.com/cast/docs/ios_sender/) to add the SDK to your project

- ⚠️ Make sure you're using Google Cast SDK version `4.3.0` until the [duplicate symbol issue](https://issuetracker.google.com/issues/113069508) is fixed

- In `AppDelegate.m` add

  ```obj-c
  #import <GoogleCast/GoogleCast.h>
  ```

  and in the `didFinishLaunchingWithOptions` method add:

  ```obj-c
  GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKDefaultMediaReceiverApplicationID];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

  (or replace `kGCKDefaultMediaReceiverApplicationID` with your custom receiver app id).

## Android

- Follow [Android Setup Guide](https://developers.google.com/cast/docs/android_sender/)

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

- ⚠️ Change your `MainActivity` to extend `GoogleCastActivity`.

  ```java
  import com.facebook.react.GoogleCastActivity;

  public class MainActivity extends GoogleCastActivity {
    // ..
  }
  ```

  If you already extend other class than `ReactActivity` (e.g. if you use `react-native-navigation`) or integrate React Native in native app, make sure that the `Activity` is a descendant of `android.support.v7.app.AppCompatActivity`. Then add `CastContext.getSharedInstance(this);` to your `Activity`'s `onCreate` method (this lazy loads the Google Cast context).

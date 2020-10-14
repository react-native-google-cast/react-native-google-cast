---
id: ExpandedController
title: ExpandedController
sidebar_label: ExpandedController
---

The [expanded controller](https://developers.google.com/cast/docs/design_checklist/sender#sender-expanded-controller) is a full screen view which offers full control of the remote media playback. This view should allow a casting app to manage every manageable aspect of a cast session, with the exception of receiver volume control and session lifecycle (connect/stop casting). It also provides all the status information about the media session (artwork, title, subtitle, and so forth).

To use the default expanded controller:

- iOS: in `AppDelegate.m`'s `didFinishLaunchingWithOptions` method add

  ```obj-c
  [GCKCastContext sharedInstance].useDefaultExpandedMediaControls = YES;
  ```

- Android: in `AndroidManifest.xml` add

  ```xml
  <activity android:name="com.reactnative.googlecast.RNGCExpandedControllerActivity" />
  ```

Then, to show the expanded controller, call

```js
GoogleCast.showExpandedControls()
```

The expanded controller will also be shown automatically when the user taps the mini controller.

## Customizing expanded controller

TODO

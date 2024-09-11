---
id: ExpandedController
title: ExpandedController
sidebar_label: ExpandedController
---

The [expanded controller](https://developers.google.com/cast/docs/design_checklist/sender#sender-expanded-controller) is a full screen view which offers full control of the remote media playback. This view should allow a casting app to manage every manageable aspect of a cast session, with the exception of receiver volume control and session lifecycle (connect/stop casting). It also provides all the status information about the media session (artwork, title, subtitle, and so forth).

### Setup

To use the default expanded controller:

#### Expo

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-cast",
        {
          // ...
          "expandedController": true
        }
      ]
    ]
  }
}
```

#### iOS

In `AppDelegate`'s `application:didFinishLaunchingWithOptions` method add

<!--DOCUSAURUS_CODE_TABS-->
<!--Objective-C-->

```obj-c
[GCKCastContext sharedInstance].useDefaultExpandedMediaControls = true;
```

<!--Swift-->

```swift
GCKCastContext.sharedInstance().useDefaultExpandedMediaControls = true
```

<!--END_DOCUSAURUS_CODE_TABS-->

#### Android

In `AndroidManifest.xml` add

```xml
<activity android:name="com.reactnative.googlecast.RNGCExpandedControllerActivity" />
```

### Usage

Then, to show the expanded controller, call

```js
GoogleCast.showExpandedControls()
```

The expanded controller will also be shown automatically when the user taps the mini controller.

## Customizing expanded controller

Not implemented yet

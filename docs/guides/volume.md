---
id: volume
title: Volume
sidebar_label: Volume
---

The Cast framework automatically manages the volume for the sender app and synchronizes the sender and receiver apps so that the sender UI always reports the volume specified by the receiver.

On Android, physical button volume control is enabled automatically.

On iOS, you need to enable it when initializing the cast context in `AppDelegate`:

<!--DOCUSAURUS_CODE_TABS-->
<!--Objective-C-->

```obj-c
// insert this line
options.physicalVolumeButtonsWillControlDeviceVolume = true;
// before
[GCKCastContext setSharedInstanceWithOptions:options];
```

<!--Swift-->

```swift
// insert this line
options.physicalVolumeButtonsWillControlDeviceVolume = true
// before
GCKCastContext.setSharedInstanceWith(options)
```

<!--END_DOCUSAURUS_CODE_TABS-->

You can also change the volume using [client.setStreamVolume](../api/classes/remotemediaclient#setstreamvolume).

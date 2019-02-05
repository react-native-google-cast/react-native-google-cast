---
id: volume
title: Volume
sidebar_label: Volume
---

The Cast framework automatically manages the volume for the sender app and synchronizes the sender and receiver apps so that the sender UI always reports the volume specified by the receiver.

Physical button volume control is automatically enabled on Android. On iOS, you need to enable it when initializing the cast context:

```objc
GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKMediaDefaultReceiverApplicationID];
options.physicalVolumeButtonsWillControlDeviceVolume = YES;
[GCKCastContext setSharedInstanceWithOptions:options];
```

Or, you can control the volume programmatically:

TODO

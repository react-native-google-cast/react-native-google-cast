---
id: customize-ui
title: Customize UI
sidebar_label: Customize UI
---

Please refer to the official guides for [Android](https://developers.google.com/cast/docs/android_sender/customize_ui) and [iOS](https://developers.google.com/cast/docs/ios_sender/customize_ui). Most of the UI customization is done globally (XML files for Android, in `AppDelegate.swift`/`.m` for iOS), so there's nothing React Native specific.

For the expanded controller's Android theme override, see [ExpandedController](../components/ExpandedController#overriding-the-theme).

## Artwork / image selection

Cast media metadata can carry multiple images. Which one shows up on each UI surface (cast dialog, notification, mini controller, expanded controller background, lock screen) is decided by an **image picker**. In v5 the library installs the same default heuristic on **both platforms** (v4 only had it on Android):

| Situation                                                        | Picked image |
| ---------------------------------------------------------------- | ------------ |
| No images in the metadata                                        | none (plain notification / default artwork) |
| Exactly one image                                                | the first    |
| Cast-dialog surface (Android dialog background / iOS cast dialog) | the first    |
| Any other surface (background, mini controller, notification, lock screen) | the second   |

The convention this encodes: list a **small thumbnail first** and a **larger artwork second** in your `MediaMetadata` images.

### Overriding on iOS

Set your own [`GCKUIImagePicker`](https://developers.google.com/cast/docs/reference/ios/protocol_g_c_k_u_i_image_picker-p) in your AppDelegate, right after initializing the cast context:

```swift
class MyImagePicker: NSObject, GCKUIImagePicker {
  func getImageWith(_ imageHints: GCKUIImageHints, from metadata: GCKMediaMetadata) -> GCKImage? {
    return metadata.images().first as? GCKImage
  }
}

// in your AppDelegate:
let imagePicker = MyImagePicker() // stored property, not a local

// in application(_:didFinishLaunchingWithOptions:), after GCKCastContext.setSharedInstanceWith(options):
GCKCastContext.sharedInstance().imagePicker = imagePicker
```

If you don't set a picker, the SDK exposes its own default (which always selects the first image); the library replaces only that default with its v4-parity picker above. A **custom picker you set in AppDelegate is never overwritten** — the library checks before installing, and AppDelegate runs before the library initializes.

> `GCKCastContext.imagePicker` holds a strong reference, but keeping your picker in an AppDelegate property (as above) also keeps it reachable if the context is ever re-created.

### Overriding on Android

Subclass `NitroCastOptionsProvider` and override `getImagePicker()` (see [Custom OptionsProvider](../getting-started/setup#custom-optionsprovider)):

```kotlin
import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.media.ImageHints
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.common.images.WebImage
import com.margelo.nitro.googlecast.NitroCastOptionsProvider

class MyOptionsProvider : NitroCastOptionsProvider() {
  override fun getImagePicker(): ImagePicker? {
    return object : ImagePicker() {
      override fun onPickImage(metadata: MediaMetadata?, hints: ImageHints): WebImage? {
        return metadata?.images?.firstOrNull()
      }
    }
  }
}
```

If you have a use case where you need customization that requires React Native integration (custom buttons on widgets, maybe?), please open an issue.

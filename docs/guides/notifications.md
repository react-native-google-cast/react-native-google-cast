---
id: notifications
title: Notifications
sidebar_label: Notifications
---

## Android

When a cast session is active, the library's `NitroCastOptionsProvider` posts a **media notification** with playback controls, which Android also surfaces as **lock-screen controls**. This works out of the box — no code needed (see [Setup](../getting-started/setup#android)).

### Default actions

The notification's actions adapt to what's playing (v4-parity heuristic):

| Content                    | Actions                                      | Compact (collapsed) view  |
| -------------------------- | -------------------------------------------- | ------------------------- |
| Queue (more than one item) | previous · play/pause · next · stop casting  | play/pause · next         |
| Photo                      | play/pause · stop casting                    | play/pause · stop casting |
| Everything else (default)  | rewind · play/pause · forward · stop casting | play/pause · stop casting |

Artwork uses the library's default [image picker](customize-ui#artwork--image-selection); with no images in the media metadata, a plain notification is shown.

To customize the actions, subclass `NitroCastOptionsProvider` and override `getNotificationOptions(context)` (see [Custom OptionsProvider](../getting-started/setup#custom-optionsprovider)).

### Disabling notifications

- **Expo:** set the plugin prop `androidNotificationsEnabled: false`.
- **Bare RN:** add the meta-data to your `AndroidManifest.xml`:

  ```xml
  <meta-data
    android:name="com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED"
    android:value="false" />
  ```

Both routes make the provider pass `null` notification options to the Cast SDK; the image picker and expanded-controller wiring stay active.

### `POST_NOTIFICATIONS` permission (Android 13+)

On API 33+, notifications require the [`POST_NOTIFICATIONS`](https://developer.android.com/develop/ui/views/notifications/notification-permission) **runtime permission**. Neither the Cast SDK nor this library declares or requests it — that's app policy (v4 behaved the same). If the user denies (or is never asked for) notification permission, the cast notification simply doesn't appear; casting itself is unaffected. Declare the permission in your manifest and request it at an appropriate moment if you want the notification shown:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Cast framework version floor (≥ 21.3.0)

Since Cast framework **21.3.0** (March 2023), media notifications are posted via `NotificationManager` — there is **no foreground service involved**, so no foreground-service permissions are needed and the Android 14 FGS-type requirements don't apply.

If you pin `castFrameworkVersion` (or the `androidPlayServicesCastFrameworkVersion` Expo prop) **below 21.3.0**, you re-enter the foreground-service world at your own risk: those versions crash on Android 14+ unless you wire the FGS permissions yourself — see [#447](https://github.com/react-native-google-cast/react-native-google-cast/issues/447) and [#527](https://github.com/react-native-google-cast/react-native-google-cast/issues/527). The Expo plugin warns at prebuild time when it detects such a pin. Use 21.3.0+ (v5 is developed against 22.x).

## iOS

Per [Google's sender app design checklist](https://developers.google.com/cast/docs/design_checklist/sender), **notifications and lock-screen controls are Android-only** — "it is not possible to implement notifications in iOS or Chrome". The iOS Cast SDK provides no notification surface, and v5 adds none.

If you want iOS lock-screen / control-center UI for your cast session, you'd have to drive [`MPNowPlayingInfoCenter`](https://developer.apple.com/documentation/mediaplayer/mpnowplayinginfocenter) yourself from the session's media status. That's out of scope for this library.

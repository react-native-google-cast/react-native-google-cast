---
id: ExpandedController
title: ExpandedController
sidebar_label: ExpandedController
---

The [expanded controller](https://developers.google.com/cast/docs/design_checklist/sender#sender-expanded-controller) is a full screen view which offers full control of the remote media playback. This view should allow a casting app to manage every manageable aspect of a cast session, with the exception of receiver volume control and session lifecycle (connect/stop casting). It also provides all the status information about the media session (artwork, title, subtitle, and so forth).

### Setup

#### iOS

No setup is needed — `showExpandedControls()` presents the Cast SDK's default expanded controls directly.

#### Android

Register the library's expanded controller activity in your app's `AndroidManifest.xml`:

```xml
<activity
  android:name="com.margelo.nitro.googlecast.NitroExpandedControllerActivity"
  android:exported="false"
  android:theme="@style/Theme.AppCompat.NoActionBar" />
```

> Automatic wiring (including the Expo config plugin) ships in a later v5 release. Until then the manifest entry is required — calling `showExpandedControls()` without it rejects a `CastError` with code `notSupported` whose message points you here.

### Usage

To show the expanded controller, call

```js
const shown = await GoogleCast.showExpandedControls()
```

It resolves `true` once the present/launch call was issued (what the launched controller does next is not observable from JS), and `false` when there is no current Activity (Android).

## Customizing expanded controller

Not implemented yet (planned for a later v5 release, along with notifications and the mini controller integration).

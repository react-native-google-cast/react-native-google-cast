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

No setup is needed — `NitroExpandedControllerActivity` is registered automatically by the library's manifest (merged into your app at build time). Tapping the media notification also opens it.

> **Upgrading from an earlier v5 release (6.1):** if you added the manual `<activity android:name="com.margelo.nitro.googlecast.NitroExpandedControllerActivity" ...>` declaration to your app manifest, **remove it** — it now conflicts with the library-supplied declaration (the manifest merger fails on the `android:theme` attribute). See the [migration guide](../guides/migrating-v4-to-v5).

##### Overriding the theme

The activity uses the library-defined theme `NitroCastExpandedController` (parent `Theme.AppCompat.NoActionBar`). To restyle it, redefine the style in your app's resources (e.g. `android/app/src/main/res/values/styles.xml`) — app resources win the resource merge:

```xml
<style name="NitroCastExpandedController" parent="Theme.AppCompat.NoActionBar">
  <!-- your customizations -->
  <item name="android:windowBackground">@android:color/black</item>
</style>
```

### Usage

To show the expanded controller, call

```js
const shown = await GoogleCast.showExpandedControls()
```

It resolves `true` once the present/launch call was issued (what the launched controller does next is not observable from JS), and `false` when there is no current Activity (Android).

## Customizing expanded controller

Beyond the Android theme override above, controller customization (buttons, layout) is not implemented yet — planned for a later v5 release, along with the mini controller integration.

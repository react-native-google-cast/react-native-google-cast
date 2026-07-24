---
id: CastButton
title: CastButton
sidebar_label: CastButton
---

The Cast button displays the Cast icon. It automatically changes appearance based on state (available, connecting, connected).

When clicking the button, the native [Cast Dialog](https://developers.google.com/cast/docs/design_checklist/cast-dialog) is presented which enables the user to connect to a Chromecast, and, when casting, to play/pause and change volume.

```jsx
import { CastButton } from 'react-native-google-cast'

function MyComponent() {
  return <CastButton tintColor="black" style={{ width: 24, height: 24 }} />
}
```

## Props

Besides the standard React Native `View` props:

| Prop        | Type         | Description                                                                              |
| ----------- | ------------ | ---------------------------------------------------------------------------------------- |
| `tintColor` | `ColorValue` | Color of the Cast icon (e.g. `'black'`, `'#ff0000'`). Omit to use the platform default. Removing the prop resets to the default. |

> In v4 the tint was set via `style={{ tintColor }}`; in v5 it is a dedicated prop.

## Why keep a CastButton mounted

Besides being the standard way to start casting, a mounted, visible `CastButton` also:

- **anchors the introductory overlay** — [`showIntroductoryOverlay`](../api/classes/castcontext) attaches to the most recently attached visible button and resolves `false` when there is none;
- **(Android) triggers active device discovery** — the Cast framework only performs an ACTIVE scan while a Cast button (or dialog) is on screen, so devices are discovered reliably while one is mounted;
- **(iOS) starts discovery in the first place** — with the default `GCKCastOptions`, the Cast SDK doesn't discover anything until the user taps the Cast button for the first time (this tap also triggers the [iOS 14+ local network permission flow](https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery)); on later launches the SDK manages discovery automatically.

Note that unlike v4, [`showCastDialog`](../api/classes/castcontext) no longer requires a mounted `CastButton` — it presents the dialog directly.

## Web

On web, `CastButton` renders the Cast Web Sender framework's
[`<google-cast-launcher>` element](https://developers.google.com/cast/docs/web_sender/integrate#add_a_cast_button),
whose appearance, visibility, and click handling (opening the browser's Cast
picker) are managed entirely by the CAF framework:

- `tintColor` maps to the launcher's documented `--connected-color` **and**
  `--disconnected-color` CSS custom properties (the single native tint
  applies to both states). Omit it for the SDK's default colors.
- `style` and the other `View` props apply to a wrapping react-native-web
  `View`; the launcher fills it. Give it an explicit size (e.g.
  `style={{ width: 24, height: 24 }}`) — the element has no intrinsic size.
- Until the [Web Sender SDK](../getting-started/web) is loaded (and in
  browsers/environments without Cast support, or before the SDK script
  loads), it renders nothing — a graceful no-op.

The ["Why keep a CastButton mounted"](#why-keep-a-castbutton-mounted) notes
are native-only: on web the browser owns discovery and the device picker, so
no mounted button is needed to scan (and `showIntroductoryOverlay` resolves
`false` on web).

## Custom Cast Button and Cast Dialog

Instead of using the `CastButton` component and the default Cast dialog, you may build custom UI for choosing a device to cast to.

First, you need to retrieve a list of nearby Cast devices using [DiscoveryManager](../api/classes/discoverymanager) or the `useDevices` hook. Because there is no `CastButton` on screen to trigger discovery, you must start it yourself on iOS (see the platform notes below) — otherwise the list stays empty. You may then use [startSession](../api/classes/sessionmanager#startsession) to connect to a device, and [endCurrentSession](../api/classes/sessionmanager#endcurrentsession) to stop casting.

```js
import { useEffect } from 'react'
import GoogleCast, { useCastDevice, useDevices } from 'react-native-google-cast'

function MyComponent() {
  const castDevice = useCastDevice()
  const devices = useDevices()
  const sessionManager = GoogleCast.getSessionManager()

  useEffect(() => {
    // Required for custom pickers on iOS: without a CastButton tap, the Cast
    // SDK never starts discovery on its own. The first start triggers the
    // local network permission prompt. No-op on Android.
    GoogleCast.getDiscoveryManager().startDiscovery()
  }, [])

  return devices.map((device) => {
    const active = device.deviceId === castDevice?.deviceId

    return (
      <Button
        key={device.deviceId}
        onPress={() =>
          active
            ? sessionManager.endCurrentSession()
            : sessionManager.startSession(device.deviceId)
        }
        title={device.friendlyName}
      />
    )
  })
}
```

Note that discovery is user-interaction-gated by the Cast SDK on both platforms, so a fully custom UI may see an empty or stale device list:

- **Android** — active device discovery only runs while native Cast UI (a `CastButton` or Cast dialog) is on screen. Keep a (possibly invisible) `CastButton` mounted, or present the native dialog, to keep the list fresh.
- **iOS** — with the default `GCKCastOptions`, discovery doesn't start at all until the first-ever Cast button tap. For a custom picker, call [`DiscoveryManager.startDiscovery()`](../api/classes/discoverymanager#startdiscovery) ([Google's documented requirement for custom pickers](https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery)); note the first start triggers the local network permission prompt.

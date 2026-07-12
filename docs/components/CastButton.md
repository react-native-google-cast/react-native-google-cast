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
- **(Android) triggers active device discovery** — the Cast framework only performs an ACTIVE scan while a Cast button (or dialog) is on screen, so devices are discovered reliably while one is mounted.

Note that unlike v4, [`showCastDialog`](../api/classes/castcontext) no longer requires a mounted `CastButton` — it presents the dialog directly.

On web, `CastButton` renders nothing (web sender support comes in a later phase).

## Custom Cast Button and Cast Dialog

Instead of using the `CastButton` component and the default Cast dialog, you may build custom UI for choosing a device to cast to.

First, you need to retrieve a list of nearby Cast devices using [DiscoveryManager](../api/classes/discoverymanager) or the `useDevices` hook. You may then use [startSession](../api/classes/sessionmanager#startsession) to connect to a device, and [endCurrentSession](../api/classes/sessionmanager#endcurrentsession) to stop casting.

```js
import GoogleCast, { useCastDevice, useDevices } from 'react-native-google-cast'

function MyComponent() {
  const castDevice = useCastDevice()
  const devices = useDevices()
  const sessionManager = GoogleCast.getSessionManager()

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

Note that on Android, active device discovery only runs while native Cast UI (a `CastButton` or Cast dialog) is on screen — a fully custom UI may see an empty or stale device list. Keep a (possibly invisible) `CastButton` mounted, or present the native dialog, to keep the list fresh.

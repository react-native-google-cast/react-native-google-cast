---
id: CastButton
title: CastButton
sidebar_label: CastButton
---

The Cast button displays the Cast icon. It automatically changes appearance based on state (available, connecting, connected). If no Chromecast devices are in range, the button is not rendered.

When clicking the button, the native [Cast Dialog](https://developers.google.com/cast/docs/design_checklist/cast-dialog) is presented which enables the user to connect to a Chromecast, and, when casting, to play/pause and change volume.

```js
import { CastButton } from 'react-native-google-cast'

// ...
  render() {
    // ...
    <CastButton style={{width: 24, height: 24, tintColor: 'black'}} />
  }
```

The default Cast button behavior can be customized but this is not supported yet by this library.

## Custom Cast Button and Cast Dialog

Instead of using the `CastButton` component and the default Cast dialog, you may build custom UI for choosing a device to cast to.

First, you need to retrieve a list of nearby Cast devices using [DiscoveryManager](../api/classes/discoverymanager) or the `useDevices` hook. You may then use [startSession](../api/classes/sessionmanager#startsession) to connect to a device, and [endCurrentSession](../api/classes/sessionmanager#endcurrentsession) to stop casting.

```js
import GoogleCast, { useDevices } from 'react-native-google-cast'

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

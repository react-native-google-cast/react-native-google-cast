---
id: hooks
title: Hooks
sidebar_label: Hooks
---

If you're using functional components, the library provides a number of hooks that help you react to its state.

## Cast State Hook

Receive the current [CastState](../api/enums/caststate).

```js
import { useCastState } from 'react-native-google-cast'

function MyComponent() {
  const castState = useCastState()

  // 'noDevicesAvailable' | 'notConnected' | 'connecting' | 'connected'
}
```

Unlike v4 (which returned `null` until its async initialization finished), v5 always returns a `CastState` — during the brief native-init window it reports the seeded `noDevicesAvailable`.

## Devices Hook

Receive a list of available [Device](../api/interfaces/device)s. The array is frozen and referentially stable while the list is unchanged.

```js
import GoogleCast, { useDevices } from 'react-native-google-cast'

function MyComponent() {
  const devices = useDevices()

  // present the devices, for example:
  return devices.map((device) => (
    <Button
      key={device.deviceId}
      onPress={() =>
        GoogleCast.getSessionManager().startSession(device.deviceId)
      }
      title={device.friendlyName}
    />
  ))
}
```

## Session Hook

Receive the current [CastSession](../api/classes/castsession).

```js
import { useCastSession } from 'react-native-google-cast'

function MyComponent() {
  const castSession = useCastSession()

  // may be `null` if session is not connected
  if (castSession) {
    // ...
  }
}
```

The same session reference is returned for the lifetime of a session, then a fresh one once a new session starts.

By default, a **suspended** session (e.g. the app was backgrounded on iOS) reads as `null` until it resumes. Pass `{ ignoreSessionUpdatesInBackground: true }` to keep the last session visible across the suspension instead:

```js
const castSession = useCastSession({ ignoreSessionUpdatesInBackground: true })
```

Two caveats with this option:

- The retained session is **inert while suspended** — calling methods on it rejects a `CastError` with code `noSession`. Use it for rendering ("still connected to X"), not for calls.
- Once the session **resumes**, the hook hands out a **fresh object reference** (even though it's the same session). Key your effects on `castSession?.id`, which is stable across a suspend/resume of the same session, rather than on the object:

```js
useEffect(() => {
  // ...
}, [castSession?.id])
```

## Cast Device Hook

Receive the [Device](../api/interfaces/device) the current session is connected to, or `null` when not connected.

```js
import { useCastDevice } from 'react-native-google-cast'

function MyComponent() {
  const castDevice = useCastDevice()

  // castDevice?.friendlyName
}
```

It delegates to `useCastSession`, so the same options apply — `useCastDevice({ ignoreSessionUpdatesInBackground: true })` keeps the device visible while the session is suspended. The device reference is stable for the session's lifetime.

## Custom Channel Hook

Create and use a [CastChannel](../api/classes/castchannel).

```js
import { useCastChannel } from 'react-native-google-cast'

function MyComponent() {
  const channel = useCastChannel('urn:x-cast:com.example.custom')

  // may be `null` if session is not connected
  if (channel) {
    // ...
  }
}
```

## Client Hook

Receive the current [RemoteMediaClient](../api/classes/remotemediaclient).

```js
import { useRemoteMediaClient } from 'react-native-google-cast'

function MyComponent() {
  const client = useRemoteMediaClient()

  // may be `null` if session is not connected
  if (client) {
    // ...
  }
}
```

## Media Status Hook

Receive the current [MediaStatus](../api/interfaces/mediastatus).

```js
import { useMediaStatus } from 'react-native-google-cast'

function MyComponent() {
  const mediaStatus = useMediaStatus()

  // may be `null` if there's no current media
  if (mediaStatus) {
    // ...
  }
}
```

Note that the media status is only updated when the status of the stream changes. Therefore, `mediaStatus.streamPosition` only reflects the time of the last status update.

If you need to know the current progress in near real-time\*, see `useStreamPosition` instead:

```js
import { useStreamPosition } from 'react-native-google-cast'

function MyComponent() {
  const streamPosition = useStreamPosition()

  // may be `null` if there's no current media
  if (streamPosition) {
    // ...
  }
}
```

By default, the position updates once per second. You may change the interval by passing a number of seconds. For example, `useStreamPosition(0.5)` updates twice per second while `useStreamPosition(10)` would only update every 10 seconds.

> \* Note that the Cast device doesn't notify of the stream position in real-time. Hence, the stream position is an approximation as calculated from the last received stream information and the elapsed wall-time since that update. In practice, you should be seeing a close-enough estimate but it might be slightly delayed compared to the actual stream.

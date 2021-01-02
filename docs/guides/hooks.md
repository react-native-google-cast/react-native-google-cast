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

  // ...
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

  // may be `null` if session is not connected
  if (mediaStatus) {
    // ...
  }
}
```

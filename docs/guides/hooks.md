---
id: hooks
title: Hooks
sidebar_label: Hooks
---

If you're using functional components, the library provides a number of hooks that help you manage its state.

## Cast State Hooks

Receive the current [CastState](../api/enums/caststate).

```js
import { useCastState } from 'react-native-google-cast'

const castState = useCastState()
```

## Session Hooks

Receive the current [CastSession](../api/classes/castsession).

```js
import { useCastSession } from 'react-native-google-cast'

const castSession = useCastSession()
```

## Client Hooks

[RemoteMediaClient](../api/classes/remotemediaclient) controls media playback on a Cast receiver.

```js
// Status of the media has changed. The `mediaStatus` object contains the new status.
client.onMediaStatusUpdated((mediaStatus) => {})
```

For convenience, the following events are triggered in addition to `onMediaStatusUpdated` in these special cases (they're called after `onMediaStatusUpdated`, if you're subscribed to both).

```js
// Media started playing
client.onMediaPlaybackStarted((mediaStatus) => {})

// Media finished playing
client.onMediaPlaybackEnded((mediaStatus) => {})
```

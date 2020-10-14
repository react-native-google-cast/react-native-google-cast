---
id: events
title: Events
sidebar_label: Events
---

The library emits events to inform you about current state.

> The new Hooks API automatically handles native events and updates your component state. If you're using functional components, it's recommended you use hooks instead of events.

## Cast State Events

Triggered when the [CastState](../api/classes/castcontext#static-getcaststate) changes.

```js
import GoogleCast from 'react-native-google-cast'

const listener = GoogleCast.onCastStateChanged((castState) => {
  // 'noDevicesAvailable' | 'notConnected' | 'connecting' | 'connected'
})

// when you want to stop listening
listener.remove()
```

## Session Events

A session is an end-to-end connection from a sender application (mobile app) to a receiver application (on Chromecast).

```js
const sessionManager = GoogleCast.getSessionManager()

const listener = sessionManager.onSessionStarted((session) => {
  /* callback */
})
```

For a full list of events see [SessionManager](../api/classes/sessionmanager).

## Client Events

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

<!-- ## Channel Events

A virtual communication channel for exchanging messages between a Cast sender (mobile app) and a Cast receiver (on Chromecast).

Each channel is tagged with a unique namespace, so multiple channels may be multiplexed over a single network connection between a sender and a receiver.

A channel must be registered by calling `GoogleCast.initChannel('urn:x-cast:...')` before it can be used. When the associated session is established, the channel will be connected automatically and can then send and receive messages.

```js
// Communication channel established
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_CONNECTED,
  ({ namespace }) => {}
)

// Communication channel terminated
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_DISCONNECTED,
  ({ namespace }) => {}
)

// Message received
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_MESSAGE_RECEIVED,
  ({ namespace, message }) => {}
)

// Send message
GoogleCast.sendMessage(namespace, message)
``` -->

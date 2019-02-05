---
id: events
title: Events
sidebar_label: Events
---

The library emits events to inform you about current state.

## Session Events

A session is an end-to-end connection from a sender application (mobile app) to a receiver application (on Chromecast).

```js
import GoogleCast from 'react-native-google-cast'

// Establishing connection to Chromecast
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTING, () => {
  /* callback */
})

// Connection established
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => {
  /* callback */
})

// Connection failed
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_START_FAILED, error => {
  console.error(error)
})

// Connection suspended (your application went to background or disconnected)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_SUSPENDED, () => {
  /* callback */
})

// Attempting to reconnect
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMING, () => {
  /* callback */
})

// Reconnected
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMED, () => {
  /* callback */
})

// Disconnecting
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDING, () => {
  /* callback */
})

// Disconnected (error provides explanation if ended forcefully)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, error => {
  /* callback */
})
```

## Media Events

Remote media client controls media playback on a Cast receiver.

```js
// Status of the media has changed. The `mediaStatus` object contains the new status.
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_STATUS_UPDATED,
  ({ mediaStatus }) => {},
)
```

For convenience, the following events are triggered in addition to `MEDIA_STATUS_UPDATED` in these special cases (they're called after `MEDIA_STATUS_UPDATED`, if you're subscribed to both).

```js
// Media started playing
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_PLAYBACK_STARTED,
  ({ mediaStatus }) => {},
)

// Media finished playing
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_PLAYBACK_ENDED,
  ({ mediaStatus }) => {},
)
```

## Channel Events

A virtual communication channel for exchanging messages between a Cast sender (mobile app) and a Cast receiver (on Chromecast).

Each channel is tagged with a unique namespace, so multiple channels may be multiplexed over a single network connection between a sender and a receiver.

A channel must be registered by calling `GoogleCast.initChannel('urn:x-cast:...')` before it can be used. When the associated session is established, the channel will be connected automatically and can then send and receive messages.

```js
// Communication channel established
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_CONNECTED,
  ({ namespace }) => {},
)

// Communication channel terminated
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_DISCONNECTED,
  ({ namespace }) => {},
)

// Message received
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_MESSAGE_RECEIVED,
  ({ namespace, message }) => {},
)

// Send message
GoogleCast.sendMessage(namespace, message)
```

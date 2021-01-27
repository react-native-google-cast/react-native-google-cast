---
id: events
title: Events
sidebar_label: Events
---

The library emits events to inform you about current state.

> The new [Hooks API](./hooks) automatically handles native events and updates your component state. If you're using functional components, it's recommended you use hooks instead of events.

> Important: Each `on`method returns a `listener`. Make sure you call `listener.remove()` when you no longer need it.

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
import GoogleCast from 'react-native-google-cast'

const sessionManager = GoogleCast.getSessionManager()

const listener = sessionManager.onSessionStarted((session) => {
  /* callback */
})
```

For a full list of events see [SessionManager](../api/classes/sessionmanager).

## Media Status Events

When multiple senders are connected to the same receiver, it is important for each sender to be aware of the changes in the receiver even if those changes were initiated from other senders.

> Note: This is important for all apps, not only those that explicitly support multiple senders, because some Cast devices have control inputs (remotes, buttons) that behave as virtual senders, affecting the status on the receiver.

```js
// Status of the media has changed. The `mediaStatus` object contains the new status.
client.onMediaStatusUpdated((mediaStatus) => {})

// For convenience, if you only want to be notified when the playback starts or ends, use one of these events:
client.onMediaPlaybackStarted((mediaStatus) => {})
client.onMediaPlaybackEnded((mediaStatus) => {})
```

Note that the media status is only updated when the status of the stream changes. Therefore, `mediaStatus.streamPosition` only reflects the time of the last status update.

If you need to know the current progress in near real-time\*, use `onMedia` instead:

```js
client.onMediaProgressUpdated((streamPosition) => { ... })
```

By default, the position updates once per second. You may change the interval by passing a number of seconds as a parameter. For example, `client.onMediaProgressUpdated(() => {}, 0.5)` updates twice per second while `client.onMediaProgressUpdated(() => {}, 10)` would only update every 10 seconds.

> \* Note that the Cast device doesn't notify of the stream position in real-time. Hence, the stream position is an approximation as calculated from the last received stream information and the elapsed wall-time since that update. In practice, you should be seeing a close-enough estimate but it might be slightly delayed compared to the actual stream.

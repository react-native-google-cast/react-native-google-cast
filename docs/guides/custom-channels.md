---
id: custom-channels
title: Custom Channels
sidebar_label: Custom Channels
---

If you've built a [custom web receiver](https://developers.google.com/cast/docs/web_receiver/basic) or an [Android TV receiver](https://developers.google.com/cast/docs/android_tv_receiver) and want to send custom messages between your Cast sender (the mobile app you're building with this library) and the Cast receiver (on Chromecast or Android TV), you need to establist a custom channel.

> Don't forget to set your custom receiver app ID as described in the [Setup](../getting-started/setup).

Each custom channel is defined by a unique namespace and must start with the prefix `urn:x-cast:`, for example, `urn:x-cast:com.example.custom`. It is possible to create multiple custom channels, each with a unique namespace. The receiver app can also send and receive messages using the same namespace.

A [CastChannel](../api/classes/castchannel) can be created on a [CastSession](../api/classes/castsession) by calling:

```ts
const channel = castSession.addChannel('urn:x-cast:...')
```

Or, if you're using hooks:

> Note that a channel with the same namespace can only be registered once at a time (you'd need to unregister previous one to create the same one again). If you need to access the channel from multiple screens, either move the call to their parent (e.g. navigator), or don't use the hook and instead call `addChannel` in a global store (e.g. Redux or Mobx). More info in [issue #316](https://github.com/react-native-google-cast/react-native-google-cast/issues/316#issuecomment-1065734844).

```ts
import { useCastChannel } from 'react-native-google-cast'

function MyComponent() {
  // channel will be automatically created on the current castSession
  const channel = useCastChannel('urn:x-cast:...')
}
```

Once you have a channel, you can send a message:

```ts
channel.sendMessage({ hello: 'world' })
```

> Please note that, by default, the custom web receiver tries to parse the message as JSON. More information in [this issue, specifically #7](https://issuetracker.google.com/issues/117136854#comment7). That means you should send and read messages as JSON objects.
>
> Alternatively, [configure the cast receiver](https://developers.google.com/cast/docs/reference/caf_receiver/cast.framework.CastReceiverOptions#customNamespaces) to use string messages:
>
> ```
> options.customNamespaces = { 'urn:x-cast:...': 'STRING' }
> ```

To process incoming messages, add a listener:

```ts
// either add as a second parameter when creating the channel
castSession.addChannel('urn:x-cast:...', message => console.log('Received message', message))
// (or when using hooks)
useCastChannel('urn:x-cast:...', message => console.log('Received message', message))

// or (re)define it after creating the channel
channel.onMessage(message => { ... })

// you may also remove the listener if no longer needed
channel.offMessage()
```

When you no longer need the channel, you can remove it:

```ts
channel.remove()
```

Note that whenever the `castSession` is disconnected, the channel will also be removed.

---
id: custom-channels
title: Custom Channels
sidebar_label: Custom Channels
---

> Custom Channels have not been finalized for v4 beta yet. They will be added before v4 is released.

For the sender app to communicate with the receiver app, your app needs to create a custom channel. The sender can use the custom channel to send string messages to the receiver. Each custom channel is defined by a unique namespace and must start with the prefix `urn:x-cast:`, for example, `urn:x-cast:com.example.custom`. It is possible to have multiple custom channels, each with a unique namespace. The receiver app can also send and receive messages using the same namespace.

<!-- The custom channel is implemented with the Cast.MessageReceivedCallback interface:

## Channel Events

A virtual communication channel for exchanging messages between a Cast sender (mobile app) and a Cast receiver (on Chromecast).

Each channel is tagged with a unique namespace, so multiple channels may be multiplexed over a single network connection between a sender and a receiver.

A channel must be registered by calling `castSession.initChannel('urn:x-cast:...')` before it can be used. When the associated session is established, the channel will be connected automatically and can then send and receive messages.

```js
castSession.initChannel

// Communication channel established
castSession.onChannelConnected((channel) => {})

// Communication channel terminated
castSession.onChannelDisconnected((channel) => {})

// Message received
channel.onMessage((message) => {})

// Send message
channel.sendMessage(message)
``` -->

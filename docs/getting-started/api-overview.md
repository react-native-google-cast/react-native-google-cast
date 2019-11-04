---
id: api-overview
title: API Overview
sidebar_label: Overview
---

<img src="https://yuml.me/diagram/classic/class/[CastContext]->[SessionManager],[CastContext]->[RemoteMediaClient],[SessionManager]-currentSession*>[Session],[SessionManager]-currentCastSession*>[CastSession],[Session]^-[CastSession],[CastSession]->[RemoteMediaClient]"/>

<!--
- `GoogleCast.getCastState().then(state => {})`
- `GoogleCast.loadMedia(mediaInfo, loadOptions)`
- `GoogleCast.play()`
- `GoogleCast.pause()`
- `GoogleCast.seek(playPosition)` - jump to position in seconds from the beginning of the stream
- `GoogleCast.stop()`
- `GoogleCast.endSession(stopCasting)`
- `GoogleCast.initChannel('urn:x-cast:...')` - initialize custom channel for communication with Cast receiver app. Once you do this, you can subscribe to `CHANNEL_*` events.
- `GoogleCast.sendMessage('urn:x-cast:...', message)` - send message over the custom channel
- -->

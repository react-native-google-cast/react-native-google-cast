---
id: usage
title: Usage
sidebar_label: Usage
---

First, require the module

```js
import { CastButton, RemoteMediaClient } from 'react-native-google-cast'
```

Render the Cast button which enables to connect to Chromecast

```js
<CastButton style={{ width: 24, height: 24 }} />
```

Stream the media to the connected Chromecast

```js
GoogleCast.load({
  contentId:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
})
```

or a slighly more complex example

```js
GoogleCast.load(
  {
    contentUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
    contentType: 'video/mp4',
    metadata: {
      metadataType: 'Movie',
      images: [
        {
          url:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
        },
      ],
      title: 'Big Buck Bunny',
      subtitle:
        'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
      studio: 'Blender Foundation',
    },
    streamDuration: 596, // seconds
  },
  {
    playPosition: 10, // seconds
  },
)
```

## API

- `GoogleCast.getCastState().then(state => {})`
- `GoogleCast.loadMedia(mediaInfo, loadOptions)`
- `GoogleCast.play()`
- `GoogleCast.pause()`
- `GoogleCast.seek(playPosition)` - jump to position in seconds from the beginning of the stream
- `GoogleCast.stop()`
- `GoogleCast.endSession(stopCasting)`
- `GoogleCast.initChannel('urn:x-cast:...')` - initialize custom channel for communication with Cast receiver app. Once you do this, you can subscribe to `CHANNEL_*` events.
- `GoogleCast.sendMessage('urn:x-cast:...', message)` - send message over the custom channel

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
  contentUrl:
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
      type: 'Movie',
    },
    streamDuration: 596, // seconds
  },
  {
    playPosition: 10, // seconds
  }
)
```

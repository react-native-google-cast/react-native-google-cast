---
id: usage
title: Usage
sidebar_label: Usage
---

First, render Cast button which handles session and enables users to connect to Cast devices. You can then get the current connected `client`, and call `loadMedia` as needed.

```ts
import React from 'react'
import { CastButton, useRemoteMediaClient } from 'react-native-google-cast'

function MyComponent() {
  // This will automatically rerender when client is connected to a device
  // (after pressing the button that's rendered below)
  const client = useRemoteMediaClient()

  if (client) {
    // Send the media to your Cast device as soon as we connect to a device
    // (though you'll probably want to call this later once user clicks on a video or something)
    client.loadMedia({
      mediaInfo: {
        contentUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
      },
    })
  }

  // This will render native Cast button.
  // When a user presses it, a Cast dialog will prompt them to select a Cast device to connect to.
  return <CastButton style={{ width: 24, height: 24, tintColor: 'black' }} />
}
```

You can provide many different attributes, such as in this example:

```ts
client.loadMedia({
  mediaInfo: {
    contentUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
    contentType: 'video/mp4',
    metadata: {
      images: [
        {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
        },
      ],
      title: 'Big Buck Bunny',
      subtitle:
        'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
      studio: 'Blender Foundation',
      type: 'movie',
    },
    streamDuration: 596, // seconds
  },
  startTime: 10, // seconds
})
```

Please see the [MediaLoadRequest](../api/interfaces/medialoadrequest) documentation for available options.

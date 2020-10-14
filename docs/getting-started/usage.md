---
id: usage
title: Usage
sidebar_label: Usage
---

First, require the module

```js
import { CastButton } from 'react-native-google-cast'
```

Render the Cast button which enables to connect to Chromecast

```js
<CastButton style={{ width: 24, height: 24 }} />
```

To stream media to the connected cast device, you first need to get the current media client:

- either using hooks:

  ```ts
  import { useCastSession } from 'react-native-google-cast'

  function MyComponent() {
    const castSession = useCastSession()

    // make sure session is available
    if (castSession) {
      const client = castSession.client
    }
  }
  ```

- or using classes:

  ```ts
  import { CastSession } from 'react-native-google-cast'

  class MyComponent extends React.Component {
    render() {
      return (
        <Button
          onPress={async () => {
            const castSession = await CastSession.getCurrent()

            // make sure session is available
            if (castSession) {
              const client = castSession.client
            }
          }}
        />
      )
    }
  }
  ```

Once you have the `client`, you can cast media by calling the `loadMedia` method:

```js
client.loadMedia({
  mediaInfo: {
    contentUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
  },
})
```

You can provide many different attributes, such as in this example:

```js
client.loadMedia({
  mediaInfo: {
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
  startTime: 10, // seconds
})
```

Please see the [loadMedia](../api/classes/remotemediaclient#loadmedia) documentation for available options.

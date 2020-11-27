---
id: usage
title: Usage
sidebar_label: Usage
---

First, render the Cast button which handles session and enables users to connect to Cast devices:

```ts
import { CastButton } from 'react-native-google-cast'

function MyComponent() {
  return <CastButton style={{ width: 24, height: 24 }} />
}
```

To stream media to the connected cast device, you first need to get the current media client:

- either using hooks:

  ```ts
  import { useRemoteMediaClient } from 'react-native-google-cast'

  function MyComponent() {
    // this will automatically rerender when client is connected
    const client = useRemoteMediaClient()

    if (client) {
      // ...
    }
  }
  ```

- or using classes:

  ```ts
  import { SessionManager } from 'react-native-google-cast'

  class MyComponent extends React.Component {
    manager = new SessionManager()
    state = {}

    // note that unlike hooks, you'll need to use events to monitor when the client is connected
    componentDidMount() {
      this.startedListener = manager.onSessionStarted((session) =>
        this.setState({ client: session.client })
      )
      this.resumedListener = manager.onSessionResumed((session) =>
        this.setState({ client: session.client })
      )
      this.suspendedListener = manager.onSessionSuspended((session) =>
        this.setState({ client: undefined })
      )
      this.endingListener = manager.onSessionEnding((session) =>
        this.setState({ client: undefined })
      )
    }
    componentWillUnmount() {
      if (this.startedListener) this.startedListener.remove()
      if (this.resumedListener) this.resumedListener.remove()
      if (this.suspendedListener) this.suspendedListener.remove()
      if (this.endingListener) this.endingListener.remove()
    }

    render() {
      if (this.state.client) {
        // ...
      }
    }
  }
  ```

Once you have the `client`, you can cast media by calling the `loadMedia` method:

```ts
client.loadMedia({
  mediaInfo: {
    contentUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
  },
})
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

Please see the [MediaLoadRequest](../api/interfaces/medialoadrequest) documentation for available options.

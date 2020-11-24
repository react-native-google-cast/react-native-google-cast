import React from 'react'
import { Button } from 'react-native'
import { useRemoteMediaClient } from 'react-native-google-cast'

export default function Queue() {
  const client = useRemoteMediaClient()

  function cast() {
    if (!client) return

    client
      .loadMedia({
        autoplay: true,
        queueData: {
          items: [
            {
              mediaInfo: {
                contentUrl:
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
                contentType: 'application/mp4',
              },
            },
            {
              mediaInfo: {
                contentUrl:
                  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
                contentType: 'application/x-mpegURL',
              },
            },
          ],
        },
      })
      .then(console.log)
      .catch(console.error)
  }

  return <Button onPress={() => cast()} title={'Play Queue'} />
}

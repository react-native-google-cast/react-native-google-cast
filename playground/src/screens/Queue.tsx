import React from 'react'
import { Button, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useMediaStatus, useRemoteMediaClient } from 'react-native-google-cast'

export default function Queue() {
  const client = useRemoteMediaClient()
  const mediaStatus = useMediaStatus()

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
      .catch(console.error)
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      <Button onPress={() => cast()} title={'Play Queue'} />

      <Text>Queue:</Text>
      {mediaStatus?.queueItems.map((item) => (
        <Text key={item.itemId}>&bull; {item.mediaInfo.contentId}</Text>
      ))}
    </ScrollView>
  )
}

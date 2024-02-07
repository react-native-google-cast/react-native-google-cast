import React, { useEffect, useState } from 'react'
import { Button, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import {
  MediaInfo,
  useMediaStatus,
  useRemoteMediaClient,
} from 'react-native-google-cast'

export default function Queue() {
  const client = useRemoteMediaClient()
  const mediaStatus = useMediaStatus()

  const [slideshow, setSlideshow] = useState(false)

  useEffect(() => {
    if (!client || !slideshow) return

    const interval = setInterval(() => {
      client.queueNext().catch(() => clearInterval(interval))
    }, 5000)

    return () => clearInterval(interval)
  }, [client, slideshow])

  function cast(mediaInfos: MediaInfo[]) {
    if (!client) return

    client
      .loadMedia({
        autoplay: true,
        queueData: {
          items: mediaInfos.map((mediaInfo) => ({ mediaInfo })),
        },
      })
      .catch(console.error)
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      <Button
        onPress={() => {
          cast([
            {
              contentUrl:
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
              contentType: 'video/mp4',
              metadata: {
                type: 'movie',
                title: 'Big Buck Bunny',
              },
            },
            {
              contentUrl:
                'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
              contentType: 'application/x-mpegURL',
              metadata: {
                type: 'generic',
                title: 'HLS test',
              },
            },
          ])

          setSlideshow(false)
        }}
        title="Play Videos"
      />

      <Button
        onPress={() => {
          cast([
            {
              contentUrl:
                'https://live.staticflickr.com/8705/16603055778_794f879d83_b.jpg',
              contentType: 'image/jpeg',
              metadata: {
                type: 'photo',
                title: 'Image 1',
              },
            },
            {
              contentUrl:
                'https://live.staticflickr.com/7073/7269798634_b92cdcc0bf_b.jpg',
              contentType: 'image/jpeg',
              metadata: {
                type: 'photo',
                title: 'Image 2',
              },
            },
            {
              contentUrl: 'http://i.stack.imgur.com/EZvw8.jpg',
              contentType: 'image/jpeg',
              metadata: {
                type: 'photo',
                title: 'Image 3',
              },
            },
          ])

          setSlideshow(true)
        }}
        title="Play Slideshow"
      />

      <Text>Queue:</Text>
      {mediaStatus?.queueItems.map((item) => (
        <Text key={item.itemId}>
          &bull; {item.mediaInfo.metadata?.title} ({item.mediaInfo.contentType})
        </Text>
      ))}
    </ScrollView>
  )
}

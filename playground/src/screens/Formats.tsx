import React from 'react'
import {
  Button,
  SectionList,
  SectionListStatic,
  Text,
  View,
} from 'react-native'
import { MediaInfo, useRemoteMediaClient } from 'react-native-google-cast'

interface FormatItem {
  title: string
  mediaInfo: MediaInfo
}

const FormatList = SectionList as SectionListStatic<FormatItem>

export default function Formats() {
  const client = useRemoteMediaClient()

  function cast(item: FormatItem) {
    if (!client) return

    client
      .loadMedia({ autoplay: true, mediaInfo: item.mediaInfo })
      .catch(console.warn)
  }

  return (
    <FormatList
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => (
        <View style={{ paddingVertical: 5, paddingHorizontal: 20 }}>
          <Button
            key={item.title}
            testID={item.title}
            onPress={() => cast(item)}
            title={item.title}
          />
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
      )}
      sections={[
        {
          title: 'Images',
          data: [
            {
              title: 'BMP',
              mediaInfo: {
                contentUrl:
                  'http://eeweb.poly.edu/~yao/EL5123/image/lena_gray.bmp',
                contentType: 'image/bmp',
                metadata: {
                  type: 'photo',
                  title: 'BMP image',
                },
              },
            },
            {
              title: 'PNG',
              mediaInfo: {
                contentUrl:
                  'https://sample-videos.com/img/Sample-png-image-500kb.png',
                contentType: 'image/png',
                metadata: {
                  type: 'photo',
                  title: 'PNG image',
                },
              },
            },
          ],
        },
        {
          title: 'Videos',
          data: [
            {
              title: 'MP4',
              mediaInfo: {
                contentUrl:
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
                contentType: 'application/mp4',
                streamDuration: 596,
                metadata: {
                  type: 'movie',
                  images: [
                    {
                      height: 1000,
                      width: 706,
                      url: 'https://m.media-amazon.com/images/M/MV5BNjRjYjRhNmQtNWE0YS00NWIwLWFhYjUtMTkzZTUwYTE4MTBiXkEyXkFqcGdeQXVyNjA3OTI5MjA@._V1_SY1000_CR0,0,706,1000_AL_.jpg',
                    },
                  ],
                  title: 'Big Buck Bunny',
                  subtitle:
                    'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
                  studio: 'Blender Foundation',
                  releaseDate: '2008-04-10',
                },
              },
            },
          ],
        },
        {
          title: 'Adaptive Streaming',
          data: [
            {
              title: 'DASH',
              mediaInfo: {
                contentUrl:
                  'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/car-20120827-manifest.mpd',
                contentType: 'video/webm',
                metadata: {
                  type: 'movie',
                  title: 'DASH Streaming Example',
                },
              },
            },
            {
              title: 'HLS',
              mediaInfo: {
                // hlsSegmentFormat: MediaHlsSegmentFormat.TS,
                // hlsVideoSegmentFormat: MediaHlsVideoSegmentFormat.MPEG2_TS,
                contentUrl:
                  // 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
                  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
                // 'https://cdn-trinity-christian-centre-01.akamaized.net/Content/HLS/Live/channel(play1)/index.m3u8',
                // 'https://d3txc6btij3mru.cloudfront.net/June/trailers/2/master.m3u8',
                // 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
                // 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
                contentType: 'application/x-mpegURL',
                // contentType: 'video/m3u8',
                // contentType: 'application/vnd.apple.mpegurl',
                metadata: {
                  type: 'movie',
                  title: 'HLS Streaming Example',
                },
              },
            },
          ],
        },
      ]}
      keyExtractor={(item, index) => item.title + index}
    />
  )
}

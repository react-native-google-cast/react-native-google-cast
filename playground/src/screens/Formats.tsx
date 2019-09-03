import React from 'react'
import {
  Button,
  SectionList,
  SectionListStatic,
  Text,
  View,
} from 'react-native'
import { NavigationScreenProps } from 'react-navigation'
import { MediaInfo, MediaMetadata, RemoteMediaClient } from '../../../lib'

interface FormatItem {
  title: string
  mediaInfo: MediaInfo
}

const FormatList = SectionList as SectionListStatic<FormatItem>

export type Props = NavigationScreenProps

export default function Formats(props: Props) {
  return (
    <FormatList
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
                contentId:
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
                contentId:
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
                contentId:
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
                contentType: 'application/mp4',
                streamDuration: 596,
                metadata: {
                  type: 'movie',
                  images: [
                    {
                      height: 1000,
                      width: 706,
                      url:
                        'https://m.media-amazon.com/images/M/MV5BNjRjYjRhNmQtNWE0YS00NWIwLWFhYjUtMTkzZTUwYTE4MTBiXkEyXkFqcGdeQXVyNjA3OTI5MjA@._V1_SY1000_CR0,0,706,1000_AL_.jpg',
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
                contentId:
                  'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/car-20120827-manifest.mpd',
                contentType: 'video/webm',
              },
            },
            {
              title: 'HLS',
              mediaInfo: {
                contentId: 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8',
                contentType: 'application/x-mpegURL',
              },
            },
          ],
        },
      ]}
      keyExtractor={(item, index) => item.title + index}
    />
  )
}

function cast(item: FormatItem) {
  RemoteMediaClient.getCurrent()
    .loadMedia(item.mediaInfo, { autoplay: true })
    .then(console.log)
    .catch(console.warn)
}

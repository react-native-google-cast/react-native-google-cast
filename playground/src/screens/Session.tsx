import React from 'react'
import {
  Button,
  SectionList,
  SectionListStatic,
  Text,
  View,
} from 'react-native'
import CastContext, {
  MediaInfo,
  useRemoteMediaClient,
} from 'react-native-google-cast'

interface FormatItem {
  title: string
  mediaInfo: MediaInfo
}

const FormatList = SectionList as SectionListStatic<FormatItem>

const DisconnectButton = () => {
  // const castState = useCastState() // TODO this is broken... always connected
  const client = useRemoteMediaClient()
  const disconnect = () => CastContext.endSession()

  return <Button onPress={disconnect} title="Disconnect" disabled={!client} />
}

export default function Session() {
  const client = useRemoteMediaClient()

  function cast(item: FormatItem) {
    if (!client) return

    client
      .loadMedia({ autoplay: true, mediaInfo: item.mediaInfo })
      .then(console.log)
      .catch(console.warn)
  }

  return (
    <>
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
        ]}
        keyExtractor={(item, index) => item.title + index}
      />
      <DisconnectButton />
    </>
  )
}

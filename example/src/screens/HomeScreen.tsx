import React, { useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import GoogleCast, {
  CastState,
  useCastState,
  useRemoteMediaClient,
} from 'react-native-google-cast'
import { Navigation, NavigationComponentProps } from 'react-native-navigation'
import { MenuProvider } from 'react-native-popup-menu'
import Menu from '../components/Menu'
import Video from '../models/Video'

export interface HomeScreenProps extends NavigationComponentProps {}

export default function HomeScreen({ componentId }: HomeScreenProps) {
  const castState = useCastState()
  const client = useRemoteMediaClient()
  const [videos, setVideos] = useState<Video[]>()

  GoogleCast.showIntroductoryOverlay()

  React.useEffect(() => {
    Video.findAll().then(setVideos).catch(console.error)

    const listener = Navigation.events().registerComponentListener(
      {
        navigationButtonPressed: ({ buttonId }) => {
          if (buttonId === 'queue') {
            Navigation.push(componentId, {
              component: {
                name: 'castvideos.Queue',
              },
            })
          }
        },
      },
      componentId
    )

    return () => listener.remove()
  }, [componentId])

  Navigation.mergeOptions(componentId, {
    topBar: {
      rightButtons: [
        {
          id: 'cast',
          component: {
            name: 'castvideos.CastButton',
          },
        },
        ...(castState === CastState.CONNECTED
          ? [
              {
                id: 'queue',
                icon: require('../assets/playlist.png'),
              },
            ]
          : []),
      ],
    },
  })

  function cast(video: Video) {
    client
      ?.loadMedia({ autoplay: true, mediaInfo: video.toMediaInfo() })
      .then(console.log)
      .catch(console.warn)

    GoogleCast.showExpandedControls()
  }

  function navigateToVideo(video: Video) {
    Navigation.push(componentId, {
      component: {
        name: 'castvideos.Video',
        passProps: {
          video,
        },
        options: {
          topBar: {
            title: {
              text: video.title,
            },
          },
        },
      },
    })
  }

  return (
    <MenuProvider skipInstanceCheck>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.title}
        renderItem={({ item: video }) => {
          return (
            <TouchableOpacity
              key={video.title}
              onPress={() => navigateToVideo(video)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
              }}
            >
              <Image
                source={{ uri: video.imageUrl }}
                style={{ width: 160, height: 90 }}
              />

              <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
                <Text>{video.title}</Text>
                <Text style={{ color: 'gray' }}>{video.studio}</Text>
              </View>

              {client && (
                <Menu
                  options={[
                    { text: 'Play Now', onPress: () => cast(video) },
                    {
                      text: 'Play Next',
                      onPress: async () => {
                        const status = await client.getMediaStatus()
                        client
                          .queueInsertItem(
                            {
                              mediaInfo: video.toMediaInfo(),
                            },
                            status && status.queueItems.length > 2
                              ? status.queueItems[1].itemId
                              : undefined
                          )
                          .catch(console.warn)
                      },
                    },
                    {
                      text: 'Add to Queue',
                      onPress: () =>
                        client
                          .queueInsertItem({
                            mediaInfo: video.toMediaInfo(),
                          })
                          .catch(console.warn),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]}
                >
                  <Image source={require('../assets/overflow.png')} />
                </Menu>
              )}
            </TouchableOpacity>
          )
        }}
        style={{ width: '100%', alignSelf: 'stretch' }}
      />
    </MenuProvider>
  )
}

HomeScreen.options = {
  topBar: {
    title: {
      alignment: 'center',
      color: 'white',
      text: 'CastVideos',
    },
    rightButtons: [
      {
        id: 'cast',
        component: {
          name: 'castvideos.CastButton',
        },
      },
    ],
  },
}

import React, { useRef, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import GoogleCast, {
  CastState,
  useCastState,
  useRemoteMediaClient,
} from 'react-native-google-cast'
import { Navigation, NavigationComponentProps } from 'react-native-navigation'
import { MenuProvider } from 'react-native-popup-menu'
import RNVideo from 'react-native-video'
import Menu from '../components/Menu'
import Video from '../models/Video'

export interface VideoScreenProps extends NavigationComponentProps {
  video: Video
}

export default function VideoScreen({ componentId, video }: VideoScreenProps) {
  const castState = useCastState()
  const client = useRemoteMediaClient()
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<RNVideo | null>(null)

  React.useEffect(() => {
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

  function cast() {
    client
      ?.loadMedia({ autoplay: true, mediaInfo: video.toMediaInfo() })
      .then(console.log)
      .catch(console.error)

    GoogleCast.showExpandedControls()
  }

  return (
    <MenuProvider skipInstanceCheck>
      <View style={styles.container}>
        <View style={styles.preview}>
          <RNVideo
            controls
            paused={!playing}
            poster={video.imageUrl}
            ref={videoRef}
            resizeMode="cover"
            source={{ uri: video.mp4Url }}
            style={styles.video}
          />

          {client ? (
            <Menu
              options={[
                { text: 'Play Now', onPress: () => cast() },
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
              <Image source={require('../assets/play_circle.png')} />
            </Menu>
          ) : !playing ? (
            <TouchableOpacity
              onPress={() => {
                if (!client) setPlaying(!playing)
              }}
            >
              <Image source={require('../assets/play_circle.png')} />
            </TouchableOpacity>
          ) : undefined}
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.subtitle}>{video.studio}</Text>
          <Text style={styles.description}>{video.subtitle}</Text>
        </View>
      </View>
    </MenuProvider>
  )
}

VideoScreen.options = {
  topBar: {
    title: {
      alignment: 'fill',
      color: 'white',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  preview: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    width: '100%',
  },
  video: StyleSheet.absoluteFillObject,

  info: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
  },
})

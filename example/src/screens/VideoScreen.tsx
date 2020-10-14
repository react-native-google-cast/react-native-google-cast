import React, { useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import GoogleCast, {
  CastState,
  useCastState,
  useRemoteMediaClient,
} from 'react-native-google-cast'
import { Navigation, NavigationComponentProps } from 'react-native-navigation'
import RNVideo from 'react-native-video'
import Video from '../models/Video'

export interface VideoScreenProps extends NavigationComponentProps {
  video: Video
}

export default function VideoScreen({ componentId, video }: VideoScreenProps) {
  const castState = useCastState()
  const client = useRemoteMediaClient()
  const [playing, setPlaying] = useState(false)

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
    <View style={styles.container}>
      {playing ? (
        <RNVideo source={{ uri: video.mp4Url }} style={styles.video} />
      ) : (
        <TouchableOpacity
          onPress={() => {
            client ? cast() : setPlaying(true)
          }}
        >
          <Image style={styles.video} source={{ uri: video.imageUrl }} />
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.subtitle}>{video.studio}</Text>
        <Text style={styles.description}>{video.subtitle}</Text>
      </View>
    </View>
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

  video: {
    height: 200,
    width: '100%',
  },

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

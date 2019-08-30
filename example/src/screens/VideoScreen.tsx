import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  MediaInfo,
  MediaLoadOptions,
  MediaMetadata,
  RemoteMediaClient,
  WebImage,
} from 'react-native-google-cast'
import { Options } from 'react-native-navigation'
import RNVideo from 'react-native-video'
import Video from '../Video'

export interface Props {
  componentId: string
  video: Video
}

interface State {
  started?: boolean
}

export default class VideoScreen extends React.Component<Props> {
  static options(passProps): Options {
    return {
      statusBar: {
        style: 'light',
      },
      topBar: {
        title: {
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
  }

  state: State = {}

  cast(video: Props['video']) {
    RemoteMediaClient.loadMedia(
      new MediaInfo({
        contentId: video.mediaUrl,
        metadata: new MediaMetadata.Movie({
          images: [
            new WebImage({ url: video.imageUrl, width: 480, height: 270 }),
            new WebImage({ url: video.posterUrl, width: 780, height: 1200 }),
          ],
          subtitle: video.subtitle,
          title: video.title,
        }),
        streamDuration: video.duration,
      }),
      new MediaLoadOptions({ autoplay: true })
    )
      .then(console.log)
      .catch(console.warn)
    // GoogleCast.launchExpandedControls()
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderVideo()}
        {this.renderInfo()}
      </View>
    )
  }

  renderVideo() {
    if (!this.state.started) {
      return (
        <TouchableOpacity onPress={() => this.setState({ started: true })}>
          <Image
            style={styles.video}
            source={{ uri: this.props.video.imageUrl }}
          />
        </TouchableOpacity>
      )
    }

    return (
      <RNVideo
        source={{ uri: this.props.video.mediaUrl }}
        style={styles.video}
      />
    )
  }

  renderInfo() {
    return (
      <View style={styles.info}>
        <Text style={styles.title}>{this.props.video.title}</Text>
        <Text style={styles.subtitle}>{this.props.video.studio}</Text>
        <Text style={styles.description}>{this.props.video.subtitle}</Text>
      </View>
    )
  }
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

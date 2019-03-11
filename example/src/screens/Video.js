import React from 'react'
import {
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  Platform,
  ToolbarAndroid,
  TouchableOpacity,
} from 'react-native'

import {
  CastButton,
  MediaInfo,
  MediaLoadOptions,
  MediaMetadata,
  RemoteMediaClient,
  WebImage,
} from 'react-native-google-cast'

import RNVideo from 'react-native-video'

export default class Video extends React.Component {
  static options(passProps) {
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
            id: 'Cast',
            component: {
              name: 'castvideos.CastButton',
            },
          },
        ],
      },
    }
  }

  state = {}

  cast(video) {
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
      new MediaLoadOptions({ autoplay: true }),
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
    if (!this.state.started)
      return (
        <TouchableOpacity onPress={() => this.setState({ started: true })}>
          <Image
            style={styles.video}
            source={{ uri: this.props.video.imageUrl }}
          />
        </TouchableOpacity>
      )

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
        <Text
          style={styles.description}
        >{`Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.`}</Text>
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

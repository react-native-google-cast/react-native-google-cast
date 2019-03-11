/* @flow */

import React from 'react'
import {
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
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

import { Navigation } from 'react-native-navigation'

export default class Demo extends React.Component {
  static options(passProps) {
    return {
      statusBar: {
        style: 'light',
      },
      topBar: {
        title: {
          alignment: 'center',
          color: 'white',
          text: 'CastVideos',
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

  constructor(props) {
    super(props)

    this.cast = this.cast.bind(this)
    this.renderVideo = this.renderVideo.bind(this)

    this.state = {
      videos: [],
    }
  }

  componentDidMount() {
    // GoogleCast.getCastState().then(console.log)

    // GoogleCast.showIntroductoryOverlay();

    const CAST_VIDEOS_URL =
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'
    fetch(CAST_VIDEOS_URL)
      .then(response => response.json())
      .then(data => {
        const mp4Url = data.categories[0].mp4
        const imagesUrl = data.categories[0].images

        this.setState({
          videos: data.categories[0].videos.map(video => ({
            title: video.title,
            subtitle: video.subtitle,
            studio: video.studio,
            duration: video.duration,
            mediaUrl: mp4Url + video.sources[2].url,
            imageUrl: imagesUrl + video['image-480x270'],
            posterUrl: imagesUrl + video['image-780x1200'],
          })),
        })
      })
      .catch(console.error)
  }

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
      <FlatList
        data={this.state.videos}
        keyExtractor={(item, index) => item.title}
        renderItem={this.renderVideo}
        style={{ width: '100%', alignSelf: 'stretch' }}
      />
    )
  }

  renderVideo({ item }) {
    const video = item

    return (
      <TouchableOpacity
        key={video.title}
        onPress={() => this.navigateToVideo(video)}
        style={{ flexDirection: 'row', padding: 10 }}
      >
        <Image
          source={{ uri: video.imageUrl }}
          style={{ width: 160, height: 90 }}
        />
        <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
          <Text style={{}}>{video.title}</Text>
          <Text style={{ color: 'gray' }}>{video.studio}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  navigateToVideo(video) {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'castvideos.Video',
        passProps: {
          video: video,
        },
      },
    })
  }
}

const styles = StyleSheet.create({})

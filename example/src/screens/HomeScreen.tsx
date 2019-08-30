import React from 'react'
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  MediaInfo,
  MediaLoadOptions,
  MediaMetadata,
  RemoteMediaClient,
  WebImage,
} from 'react-native-google-cast'
import { Navigation, Options } from 'react-native-navigation'
import Video from '../Video'

export interface Props {
  componentId: string
}

interface State {
  videos: Video[]
}

export default class HomeScreen extends React.Component<Props, State> {
  static options(passProps): Options {
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
            id: 'cast',
            component: {
              name: 'castvideos.CastButton',
            },
            // systemItem: 'camera',
          },
        ],
      },
    }
  }

  state: State = {
    videos: [],
  }

  componentDidMount() {
    // GoogleCast.getCastState().then(console.log)

    // GoogleCast.showIntroductoryOverlay();

    Video.findAll()
      .then(videos => this.setState({ videos }))
      .catch(console.error)
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

  renderVideo = ({ item }: { item: Video }) => {
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
          <Text>{video.title}</Text>
          <Text style={{ color: 'gray' }}>{video.studio}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  cast = (video: Video) => {
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

  navigateToVideo = (video: Video) => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'castvideos.Video',
        passProps: {
          video,
        },
      },
    })
  }
}

const styles = StyleSheet.create({})

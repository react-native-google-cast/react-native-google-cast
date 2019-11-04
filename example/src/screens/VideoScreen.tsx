import { ActionSheetProps } from '@expo/react-native-action-sheet'
import React from 'react'
import {
  EmitterSubscription,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Navigation, Options } from 'react-native-navigation'
import RNVideo from 'react-native-video'
import GoogleCast, { CastState, RemoteMediaClient } from '../../../lib'
import Video from '../Video'

export interface Props extends ActionSheetProps {
  componentId: string
  video: Video
}

interface State {
  started?: boolean
}

export default class VideoScreen extends React.Component<Props> {
  static options(passProps): Options {
    return {
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
  }

  castStateListener: EmitterSubscription
  state: State = {}

  componentDidMount() {
    Navigation.events().bindComponent(this)

    const setConnected = (state: CastState) => {
      this.setState({
        connected: state === 'connected',
      })

      Navigation.mergeOptions(this.props.componentId, {
        topBar: {
          rightButtons: [
            {
              id: 'cast',
              component: {
                name: 'castvideos.CastButton',
              },
            },
            ...(state === 'connected'
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
    }
    GoogleCast.getCastState().then(setConnected)
    this.castStateListener = GoogleCast.onCastStateChanged(setConnected)
  }

  componentWillUnmount() {
    this.castStateListener.remove()
  }

  cast(video: Props['video']) {
    RemoteMediaClient.getCurrent()
      .loadMedia(
        {
          contentUrl: video.mediaUrl,
          metadata: {
            images: [
              { url: video.imageUrl, width: 480, height: 270 },
              { url: video.posterUrl, width: 780, height: 1200 },
            ],
            subtitle: video.subtitle,
            title: video.title,
            type: 'movie',
          },
          streamDuration: video.duration,
        },
        { autoplay: true }
      )
      .then(console.log)
      .catch(console.warn)

    GoogleCast.showExpandedControls()
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
          <Navigation.Element elementId="videoPreview">
            <Image
              style={styles.video}
              source={{ uri: this.props.video.imageUrl }}
            />
          </Navigation.Element>
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

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'queue') {
      Navigation.push(this.props.componentId, {
        component: { name: 'castvideos.Queue' },
      })
    }
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

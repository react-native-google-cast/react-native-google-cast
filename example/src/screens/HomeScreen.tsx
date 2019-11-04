import { ActionSheetProps } from '@expo/react-native-action-sheet'
import React from 'react'
import {
  EmitterSubscription,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Navigation, Options } from 'react-native-navigation'
import GoogleCast, { CastState, RemoteMediaClient } from '../../../lib'
import Video from '../Video'

export interface Props extends ActionSheetProps {
  componentId: string
}

interface State {
  connected: boolean
  videos: Video[]
}

class HomeScreen extends React.Component<Props, State> {
  static options(passProps): Options {
    return {
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
  }

  castStateListener: EmitterSubscription
  state: State = {
    connected: false,
    videos: [],
  }

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

    GoogleCast.showIntroductoryOverlay()

    Video.findAll()
      .then(videos => this.setState({ videos }))
      .catch(console.error)
  }

  componentWillUnmount() {
    this.castStateListener.remove()
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

  renderVideo = ({ item, index }: { item: Video; index: number }) => {
    const video = item
    const elementId = `video${index}`

    return (
      <TouchableOpacity
        key={video.title}
        onPress={() => this.navigateToVideo(video, elementId)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}
      >
        <Navigation.Element elementId={elementId}>
          <Image
            source={{ uri: video.imageUrl }}
            style={{ width: 160, height: 90 }}
          />
        </Navigation.Element>

        <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
          <Text>{video.title}</Text>
          <Text style={{ color: 'gray' }}>{video.studio}</Text>
        </View>

        {this.state.connected && (
          <TouchableOpacity
            onPress={() => {
              this.props.showActionSheetWithOptions(
                {
                  options: ['Play Now', 'Play Next', 'Add to Queue', 'Cancel'],
                  cancelButtonIndex: 3,
                },
                async buttonIndex => {
                  const client = RemoteMediaClient.getCurrent()

                  if (buttonIndex === 0) {
                    this.cast(video)
                  } else if (buttonIndex === 1) {
                    const status = await client.getMediaStatus()
                    client
                      .queueInsertItem(
                        {
                          mediaInfo: item.toMediaInfo(),
                        },
                        status && status.queueItems.length > 2
                          ? status.queueItems[1].itemId
                          : null
                      )
                      .catch(console.warn)
                  } else if (buttonIndex === 2) {
                    client
                      .queueInsertItem({
                        mediaInfo: item.toMediaInfo(),
                      })
                      .catch(console.warn)
                  }
                }
              )
            }}
          >
            <Image source={require('../assets/overflow.png')} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  cast = (video: Video) => {
    RemoteMediaClient.getCurrent()
      .loadMedia(video.toMediaInfo(), { autoplay: true })
      .then(console.log)
      .catch(console.warn)

    GoogleCast.showExpandedControls()
  }

  navigateToVideo = (video: Video, elementId: string) => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'castvideos.Video',
        passProps: {
          video,
        },
        options: {
          // customTransition: {
          //   animations: [
          //     {
          //       type: 'sharedElement',
          //       fromId: elementId,
          //       toId: 'videoPreview',
          //       startDelay: 0,
          //       springVelocity: 0.2,
          //       duration: 0.5,
          //     },
          //   ],
          //   duration: 0.8,
          // },
          topBar: {
            title: {
              text: video.title,
            },
          },
        },
      },
    })
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'queue') {
      Navigation.push(this.props.componentId, {
        component: { name: 'castvideos.Queue' },
      })
    }
  }
}

export default HomeScreen

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
import styles from './main.style'
import GoogleCast, { CastButton } from 'react-native-google-cast'

class Main extends React.Component {
  constructor(props) {
    super(props)

    this.cast = this.cast.bind(this)
    this.renderVideo = this.renderVideo.bind(this)

    this.state = {
      videos: [],
    }
  }

  componentDidMount() {
    this.registerListeners()

    GoogleCast.getCastState().then(console.log)
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
    GoogleCast.getCastDevice().then(console.log)
    GoogleCast.castMedia(video)
    GoogleCast.launchExpandedControls()
    this.sendMessage()
  }

  render() {
    return (
      <View style={styles.container}>
        {Platform.OS === 'android' ? (
          <ToolbarAndroid
            title="Google Cast Example"
            contentInsetStart={4}
            actions={[{ title: 'Log out', show: 'never' }]}
            style={styles.toolbarAndroid}
          >
            <CastButton style={styles.castButtonAndroid} />
            <Button
              title="Play"
              onPress={() => GoogleCast.play()}
              style={styles.stopButton}
            />
            <Button
              title="Pause"
              onPress={() => GoogleCast.pause()}
              style={styles.stopButton}
            />
            <Button
              title="Stop"
              onPress={() => GoogleCast.endSession()}
              style={styles.stopButton}
            />
          </ToolbarAndroid>
        ) : (
          <View style={styles.toolbarIOS}>
            <Button
              title="Stop"
              onPress={() => GoogleCast.endSession()}
              style={styles.stopButton}
            />
            <CastButton style={styles.castButtonIOS} />
          </View>
        )}
        <FlatList
          data={this.state.videos}
          keyExtractor={(item, index) => index}
          renderItem={this.renderVideo}
          style={{ width: '100%', alignSelf: 'stretch' }}
        />
      </View>
    )
  }

  renderVideo({ item }) {
    const video = item

    return (
      <TouchableOpacity
        key={video.title}
        onPress={() => this.cast(video)}
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

  registerListeners() {
    const events = `
      SESSION_STARTING SESSION_STARTED SESSION_START_FAILED SESSION_SUSPENDED
      SESSION_RESUMING SESSION_RESUMED SESSION_ENDING SESSION_ENDED

      MEDIA_STATUS_UPDATED MEDIA_PLAYBACK_STARTED MEDIA_PLAYBACK_ENDED MEDIA_PROGRESS_UPDATED

      CHANNEL_CONNECTED CHANNEL_DISCONNECTED CHANNEL_MESSAGE_RECEIVED
    `
      .trim()
      .split(/\s+/)
    console.log(events)

    events.forEach(event => {
      GoogleCast.EventEmitter.addListener(GoogleCast[event], function() {
        console.log(event, arguments)
      })
    })
  }

  sendMessage() {
    const channel = 'urn:x-cast:com.reactnative.googlecast.example'

    GoogleCast.initChannel(channel).then(() => {
      debugger
      GoogleCast.sendMessage(channel, JSON.stringify({ message: 'Hello' }))
    })
  }
}

export default Main

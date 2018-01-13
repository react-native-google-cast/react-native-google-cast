/* @flow */

import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  TouchableOpacity
} from 'react-native';
import styles from './main.style';
import GoogleCast, { CastButton } from 'react-native-google-cast';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.cast = this.cast.bind(this)
    this.renderVideo = this.renderVideo.bind(this)

    this.state = {
      videos: [],
    }
  }

  componentDidMount() {
    // DeviceEventEmitter.addListener(GoogleCast.DEVICE_AVAILABLE, existance =>
    //   this.setState({ chromecastAround: existance.device_available })
    // );
    // DeviceEventEmitter.addListener(GoogleCast.MEDIA_LOADED, () => {});
    // DeviceEventEmitter.addListener(GoogleCast.DEVICE_CONNECTED, () => {
    //   this.chromecastCastMedia();
    // });
    // DeviceEventEmitter.addListener(GoogleCast.DEVICE_DISCONNECTED, () =>
    //   alert('Device disconnected!')
    // );

    const CAST_VIDEOS_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'
    fetch(CAST_VIDEOS_URL).then(response => response.json()).then(data => {
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
          posterUrl: imagesUrl + video['image-780x1200']
        }))
      });
    }).catch(console.error)
  }

  cast(video) {
    GoogleCast.castMedia(video);
  };

  render() {
    return (
      <View style={styles.container}>
        <CastButton style={{ height: 24, width: 24, marginTop: 20 }} />
        <FlatList
          data={this.state.videos}
          keyExtractor={(item, index) => index}
          renderItem={this.renderVideo}
          style={{alignSelf: 'stretch'}}
        />
      </View>
    );
  }

  renderVideo({item}) {
    const video = item

    return (
      <TouchableOpacity
        key={video.title}
        onPress={() => this.cast(video)}
        style={{flexDirection: 'row', padding: 10}}>
        <Image
          source={{uri: video.imageUrl}}
          style={{width: 160, height: 90}}
        />
        <View>
          <Text style={{}}>{ video.title }</Text>
          <Text style={{color: 'gray'}}>{ video.studio }</Text>
        </View>
      </TouchableOpacity>
    )
  }
}

export default Main;

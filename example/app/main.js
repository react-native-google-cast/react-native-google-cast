/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  TouchableOpacity,
} from 'react-native';
import styles from './main.style';
import Chromecast from 'react-native-google-cast';

type State = {
  chromecastAround: boolean,
  connected: boolean,
  chromecastList: Array<Object>,
};

const noop = () => {};

class Main extends Component {
  state: State = {
    chromecastAround: false,
    connected: false,
    chromecastList: [],
  };
  constructor(props) {
    super(props);
    this.getChromecasts = this.getChromecasts.bind(this);
  }

  componentDidMount() {
    Chromecast.startScan();
    DeviceEventEmitter.addListener(Chromecast.DEVICE_AVAILABLE, (existance) =>
      this.setState({ chromecastAround: existance.device_available })
    );
    DeviceEventEmitter.addListener(Chromecast.MEDIA_LOADED, noop);
    DeviceEventEmitter.addListener(Chromecast.DEVICE_CONNECTED, () => {
      this.chromecastCastMedia();
    });
    DeviceEventEmitter.addListener(Chromecast.DEVICE_DISCONNECTED, () =>
      alert('Device disconnected!')
    );
  }

  disconnectChromecast = () => {
    Chromecast.disconnect();
    this.setState({ connected: false });
  };

  async getChromecasts() {
    let chromecastDevices = await Chromecast.getDevices();
    this.setState({ chromecastList: chromecastDevices });
  }

  chromecastCastMedia = () => {
    this.setState({ connected: true });
    Chromecast.castMedia(
      'http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4',
      'Video Test',
      'http://camendesign.com/code/video_for_everybody/poster.jpg',
      0
    );
  };

  async connectToChromecast(id) {
    const isConnected = await Chromecast.isConnected();
    isConnected ? this.chromecastCastMedia() : Chromecast.connectToDevice(id);
  }

  renderChromecastList(chromecast) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.chromecastButton]}
        onPress={() => this.connectToChromecast(chromecast.id)}
        key={chromecast.id}
      >
        <Text style={styles.textButton}>
          {chromecast.name}
        </Text>
      </TouchableOpacity>
    );
  }

  renderDisconnect = () => {
    if (!this.state.connected) return null;
    return (
      <TouchableOpacity
        onPress={this.disconnectChromecast}
        style={[styles.button, styles.disconnectButton]}
      >
        <Text style={styles.textButton}>
          Disconnect
        </Text>
      </TouchableOpacity>
    );
  };

  renderControl() {
    if (!this.state.connected) return null;
    return (
      <TouchableOpacity
        onPress={Chromecast.togglePauseCast}
        style={[styles.button, styles.backgroundColor]}
      >
        <Text style={styles.textButton}>Play/Pause</Text>
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Is there any chromecast around?</Text>
        <Text style={styles.chromecastAround}>
          {this.state.chromecastAround ? 'YES' : 'NO'}
        </Text>
        <TouchableOpacity onPress={this.getChromecasts} style={[styles.button]}>
          <Text>
            Show chromecasts
          </Text>
        </TouchableOpacity>
        {this.state.chromecastList.map((item, index) =>
          this.renderChromecastList(item, index)
        )}
        {this.renderDisconnect()}
        {this.renderControl()}
      </View>
    );
  }
}

export default Main;

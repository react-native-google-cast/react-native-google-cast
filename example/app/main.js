/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  TouchableOpacity,
} from 'react-native';
import Chromecast from "react-native-google-cast";

class Main extends Component {
  constructor(props) {
    super(props);
    this.chromecastCastMedia = this.chromecastCastMedia.bind(this);
    this.getChromecasts = this.getChromecasts.bind(this);
    this.disconnectChromecast = this.disconnectChromecast.bind(this);
    this.renderDisconnect = this.renderDisconnect.bind(this);
    this.state = {
      chromecastAround: false,
      connected: false,
      chromecastList: []
    }
  }

   componentDidMount() {
    Chromecast.startScan();
    DeviceEventEmitter.addListener(Chromecast.DEVICE_AVAILABLE, (existance) => this.setState({chromecastAround: existance.device_available}));
    DeviceEventEmitter.addListener(Chromecast.MEDIA_LOADED, () => {});
    DeviceEventEmitter.addListener(Chromecast.DEVICE_CONNECTED, () => {this.chromecastCastMedia()});
    DeviceEventEmitter.addListener(Chromecast.DEVICE_DISCONNECTED, () => alert('Device disconnected!'));
  }

  disconnectChromecast(){
    Chromecast.disconnect();
    this.setState({connected: false});
  }

  async getChromecasts() {
    let chromecastDevices = await Chromecast.getDevices();
    this.setState({chromecastList: chromecastDevices});
  }

  chromecastCastMedia() {
    this.setState({connected: true});
    Chromecast.castMedia('http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4', 'Video Test', 'http://camendesign.com/code/video_for_everybody/poster.jpg', 0);
  };

  async connectToChromecast(id) {
    const isConnected = await Chromecast.isConnected();
    isConnected
      ? this.chromecastCastMedia()
      : Chromecast.connectToDevice(id);
  }

  renderChromecastList(chromecast) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.chromecastButton]}
        onPress={() => this.connectToChromecast(chromecast.id)}
        key={chromecast.id}>
        <Text style={styles.textButton}>
          {chromecast.name}
        </Text>
      </TouchableOpacity>);
  }

  renderDisconnect(){
    if(!this.state.connected) return null;
    return(
      <TouchableOpacity onPress={this.disconnectChromecast} style={[styles.button, styles.disconnectButton]}>
        <Text style={styles.textButton}>Disconnect</Text>
      </TouchableOpacity>
    );
  }

  renderControl(){
    if(!this.state.connected) return null;
    return(
      <TouchableOpacity onPress={Chromecast.togglePauseCast} style={[styles.button, styles.backgroundColor]}>
        <Text style={styles.textButton}>Play/Pause</Text>
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Is there any chromecast around?</Text>
        <Text style={styles.chromecastAround}>{this.state.chromecastAround ? 'YES' : 'NO' }</Text>
        <TouchableOpacity onPress={this.getChromecasts} style={[styles.button]}>
          <Text>Show chromecasts</Text>
        </TouchableOpacity>
        {this.state.chromecastList.map((item, index) => this.renderChromecastList(item, index)) }
        {this.renderDisconnect()}
        {this.renderControl()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  chromecastAround: {
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
    backgroundColor: '#42A5F5'
  },
  textButton: {
    color: 'white',
    fontWeight: 'bold',
  },
  chromecastButton: {
    backgroundColor: '#EC407A',
    marginVertical: 10,
  },
  disconnectButton: {
    marginVertical: 10,
    backgroundColor: '#f44336',
  },
  controlButton: {
    marginVertical: 10,
    backgroundColor: '#689F38'
  }
});

export default Main;

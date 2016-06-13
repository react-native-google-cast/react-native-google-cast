/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {Component} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  TouchableOpacity
} from 'react-native';

import chromecast from "./GoogleCast";

class ReactNativeGoogleCast extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chromecastAvailable: false,
      chromecastList: []
    };
  }

  componentDidMount() {
    DeviceEventEmitter.addListener("GoogleCast:DeviceAvailable", (existance) => {
      this.setState({chromecastAvailable: existance.device_available});
    });
    DeviceEventEmitter.addListener("GoogleCast:DeviceConnected", () => {
      chromecast.castMedia("", "", "", "");
    });
  }

  initialize = () => {
    chromecast.startScan();
  };

  async getDevices() {
    let dev = await chromecast.getDevices();
    this.setState({chromecastList: dev});
    console.log("test test ", dev);
  };

  connect = () => {
    chromecast.connectToDevice("Chromecast7191");
  };

  sendMedia = () => {
    chromecast.castMedia("", "", "", "");
  };

  connectToSelectedChromecast = (id) => {
    chromecast.connectToDevice(id);
  };


  render() {
    return (
      <View style={styles.container}>
        <Text>{this.state.chromecastAvailable ? "I can see chromecasts " : "Connect a chromecast"}</Text>
        <TouchableOpacity onPress={this.initialize} style={[styles.button, styles.initButton]}>
          <Text>Initialize</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.getDevices.bind(this)} style={[styles.button, styles.getDevicesButton]}>
          <Text>Get devices</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.sendMedia} style={[styles.button, styles.mediaButton]}>
          <Text>Send media</Text>
        </TouchableOpacity>
        {
          this.state.chromecastList.map((device) => {
            return (
              <TouchableOpacity style={[styles.button, styles.connectButton]}
                                key={device.id}
                                onPress={() => this.connectToSelectedChromecast(device.id)}>
                <Text>Connect to {device.name}</Text>
              </TouchableOpacity>
            )
          })
        }
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
  button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "blue",
    margin: 10,
  },
  getDevicesButton: {
    backgroundColor: "orange",
  },
  initButton: {
    backgroundColor: "green"
  },
  connectButton: {
    backgroundColor: "brown"
  },
  mediaButton: {
    backgroundColor: "magenta"
  }
});

AppRegistry.registerComponent('ReactNativeGoogleCast', () => ReactNativeGoogleCast);

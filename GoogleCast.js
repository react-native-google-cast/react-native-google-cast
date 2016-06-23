import {NativeModules} from 'react-native';

const {GoogleCast} = NativeModules;

export default {

  initChromecast: function () {
    GoogleCast.initChromecast();
  },
  startScan: function () {
    GoogleCast.startScan();
  },
  stopScan: function () {
    GoogleCast.stopScan();
  },
  isConnected: function () {
    return GoogleCast.isConnected();
  },
  getDevices: function () {
    return GoogleCast.getDevices();
  },
  connectToDevice: function (deviceId:string) {
    GoogleCast.connectToDevice(deviceId);
  },
  castMedia: function (mediaUrl:string, title:string, imageUrl:string, seconds:number) {
    GoogleCast.castMedia(mediaUrl, title, imageUrl, seconds);
  },
  seekCast: function (milliseconds:number) {
    GoogleCast.seekCast(milliseconds);
  },
  togglePauseCast: function () {
    GoogleCast.togglePauseCast();
  },
};
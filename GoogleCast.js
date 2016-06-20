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
  castMedia: function (mediaUrl:string, title:string, imageUrl:string, milliseconds:number) {
    GoogleCast.castMedia(mediaUrl, title, imageUrl, milliseconds);
  },
  connectAndCast: function (mediaUrl:string, title:string, imageUrl:string, milliseconds:number, deviceId:string) {
    GoogleCast.connectAndCast(mediaUrl, title, imageUrl, milliseconds, deviceId);
  },
  seekCast: function (milliseconds:number) {
    GoogleCast.seekCast(milliseconds);
  },
  togglePauseCast: function () {
    GoogleCast.togglePauseCast();
  },
};
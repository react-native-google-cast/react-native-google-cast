import {NativeModules} from 'react-native';

const {GoogleCast} = NativeModules;

export default {

  startScan: function () {
    GoogleCast.startScan();
  },
  getDevices: function () {
    return GoogleCast.getDevices();
  },
  connectToDevice: function (deviceId:string) {
    GoogleCast.connectToDevice(deviceId);
  },
  castMedia: function (mediaUrl:string, title:string, description:string, imageUrl:string) {
    GoogleCast.castMedia(mediaUrl, title, description, imageUrl);
  }
};
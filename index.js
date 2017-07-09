// @flow

import { NativeModules } from 'react-native';
import type { MediaType } from './GoogleCast.type';

const { RNGoogleCast } = NativeModules;

export default {
  startScan: (appId: ?string) => RNGoogleCast.startScan(appId),
  stopScan: () => RNGoogleCast.stopScan(),
  isConnected: () => RNGoogleCast.isConnected(),
  getDevices: () => RNGoogleCast.getDevices(),
  connectToDevice: (deviceId: string) => RNGoogleCast.connectToDevice(deviceId),
  disconnect: () => RNGoogleCast.disconnect(),
  castMedia: ({ mediaUrl, title, imageUrl, seconds = 0 }: MediaType) =>
    RNGoogleCast.castMedia(mediaUrl, title, imageUrl, seconds),
  seekCast: (seconds: number) => RNGoogleCast.seekCast(seconds),
  togglePauseCast: () => RNGoogleCast.togglePauseCast(),
  getStreamPosition: () => RNGoogleCast.getStreamPosition(),
};

export const EVENTS = {
  DEVICE_AVAILABLE: RNGoogleCast.DEVICE_AVAILABLE,
  DEVICE_CONNECTED: RNGoogleCast.DEVICE_CONNECTED,
  DEVICE_DISCONNECTED: RNGoogleCast.DEVICE_DISCONNECTED,
  MEDIA_LOADED: RNGoogleCast.MEDIA_LOADED,
};

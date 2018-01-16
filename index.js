import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform
} from 'react-native';

const { GoogleCast } = NativeModules;

import CastButton from './CastButton';
export { CastButton };

export default {
  castMedia: function(params: {
    mediaUrl: string,
    title: string,
    subtitle: string,
    studio: string,
    imageUrl: string,
    posterUrl: string,
    seconds: number
  }) {
    GoogleCast.castMedia(params);
  },
  launchExpandedControls: GoogleCast.launchExpandedControls,
  showIntroductoryOverlay: GoogleCast.showIntroductoryOverlay,

  // TODO use the same native event interface instead of hacking it here
  EventEmitter:
    Platform.OS === 'ios'
      ? new NativeEventEmitter(GoogleCast)
      : DeviceEventEmitter,

  SESSION_STARTED: GoogleCast.SESSION_STARTED,
  SESSION_ENDED: GoogleCast.SESSION_ENDED
};

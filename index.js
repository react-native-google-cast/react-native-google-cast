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

  SESSION_STARTING: GoogleCast.SESSION_STARTING,
  SESSION_STARTED: GoogleCast.SESSION_STARTED,
  SESSION_START_FAILED: GoogleCast.SESSION_START_FAILED,
  SESSION_SUSPENDED: GoogleCast.SESSION_SUSPENDED,
  SESSION_RESUMING: GoogleCast.SESSION_RESUMING,
  SESSION_RESUMED: GoogleCast.SESSION_RESUMED,
  SESSION_ENDING: GoogleCast.SESSION_ENDING,
  SESSION_ENDED: GoogleCast.SESSION_ENDED,
};

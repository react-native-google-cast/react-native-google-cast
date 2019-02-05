// @flow

import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'

const { RNGCSessionManager: Native } = NativeModules

import MediaInfo from './MediaInfo'
import MediaLoadOptions from './MediaLoadOptions'

// TODO use the same native event interface instead of hacking it here
// EventEmitter:
//   Platform.OS === 'ios'
//     ? new NativeEventEmitter(GoogleCast)
//     : DeviceEventEmitter

/**
 * Class for controlling a media player application running on a Cast receiver.
 *
 * @export
 * @class SessionManager
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/SessionManager}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session_manager}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer}
 */
export default class SessionManager {
  getCurrentCastSession() {
    return Native.getCurrentCastSession()
  }
}

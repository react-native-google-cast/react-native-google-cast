// @flow

import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'

const { RNGCRemoteMediaClient: Native } = NativeModules

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
 * @class RemoteMediaClient
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer}
 */
export default class RemoteMediaClient {
  // mediaQueue: MediaQueue
  // mediaStatus: MediaStatus

  /**
   * @memberof RemoteMediaClient
   * @param {MediaInfo} mediaInfo
   * @param {MediaLoadOptions} [mediaLoadOptions]
   * @returns {Promise}
   * @example
   * RemoteMediaClient.loadMedia(new MediaInfo({
   *   contentId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
   * }))
   */
  static loadMedia(mediaInfo, mediaLoadOptions) {
    return Native.loadMedia(mediaInfo, mediaLoadOptions)
  }

  /**
   *
   *
   * @returns {Promise}
   * @memberof RemoteMediaClient
   */
  static pause() {
    return Native.pause()
  }

  static play() {
    return Native.pause()
  }

  /**
   *
   * @static
   * @param {boolean} muted
   * @param {?Object} [customData]
   * @memberof RemoteMediaClient
   */
  static setStreamMuted(muted, customData) {
    return Native.setStreamMuted(muted, customData)
  }
}

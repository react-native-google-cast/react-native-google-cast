import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'
import ActiveInputState from '../types/ActiveInputState'
import ApplicationMetadata from '../types/ApplicationMetadata'
import Device from '../types/Device'
import StandbyState from '../types/StandbyState'
import RemoteMediaClient from './RemoteMediaClient'

const { RNGCCastSession: Native } = NativeModules

const EventEmitter =
  Platform.OS === 'ios' ? new NativeEventEmitter(Native) : DeviceEventEmitter

/**
 * An instance of CastSession is automatically created by the SessionManager when the user selects a Cast device from the media route controller dialog. The current active CastSession can be accessed by getCurrentCastSession().
 *
 * A class that manages a Cast session with a receiver device.
 * Sessions are created and managed automatically by the GCKSessionManager. The application should not directly call the session lifecycle methods such as start (GCKSession(Protected)) or endWithAction: (GCKSession(Protected)).
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session} | [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession}
 */
export default class CastSession {
  client?: RemoteMediaClient

  /** Indicates whether a receiver device is currently the active video input. Active input state can only be reported when the Google cast device is connected to a TV or AVR with CEC support. */
  getActiveInputState(): Promise<ActiveInputState> {
    return Native.getActiveInputState()
  }

  /**
   * Returns the metadata for the currently running receiver application, or `null` if the metadata is unavailable.
   *
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getApplicationMetadata()}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session.html#aa48324aeb26bd15ec3b7e052138ea48c}
   * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getApplicationMetadata}
   */
  getApplicationMetadata(): Promise<ApplicationMetadata> {
    return Native.getApplicationMetadata()
  }

  /**
   * Returns the current receiver application status, if any. Message text is localized to the Google Cast device's locale.
   *
   * @see [Android: getAplicationStatus]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getApplicationStatus()}
   * @see [iOS: deviceStatusText]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a1821f77bc0c0dc159419608105483a0a}
   * @see [Chrome: getApplicationStatus]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getApplicationStatus}
   */
  getApplicationStatus(): Promise<string> {
    return Native.getApplicationStatus()
  }

  async getRemoteMediaClient(): Promise<RemoteMediaClient> {
    // if (!this.client) {
    //   this.client = await Native.getRemoteMediaClient(id)
    // }
    return this.client
  }

  /**
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getCastDevice()}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a30d6130e558b235e37f1cbded2d27ce8}
   * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getCastDevice}
   */
  getCastDevice(): Promise<Device> {
    return Native.getCastDevice()
  }

  /**
   * Indicates whether a receiver device's connected TV or AVR is currently in "standby" mode.
   */
  getStandbyState(): Promise<StandbyState> {
    return Native.getStandbyState()
  }

  /**
   * Returns the device's volume.
   *
   * @returns {number} Volume in the range [0.0, 1.0].
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getVolume()}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#af4120ee98a679c4ed3abc6ba6b59cf12}
   */
  getVolume(): Promise<number> {
    return Native.getVolume()
  }

  /**
   * @returns {boolean}
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#isMute()}
   */
  isMute(): Promise<boolean> {
    return Native.isMute()
  }

  sendMessage(namespace: string, message: string): Promise<void> {
    return Native.sendMessage(namespace, message)
  }

  /**
   * Mutes or unmutes the device's audio.
   *
   * @param mute The new mute state.
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setMute(boolean)}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#aac1dc4461b6d7ae6f1f5f9dc93cafebd}
   */
  setMute(mute: boolean): Promise<void> {
    return Native.setMute(mute)
  }

  /**
   * Sets the device volume.
   *
   * @param volume If volume is outside of the range [0.0, 1.0], then the value will be clipped.
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setVolume(double)}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a68dcca2fdf1f4aebee394f0af56e7fb8}
   */
  setVolume(volume: number): Promise<void> {
    return Native.setMute(volume)
  }

  // ========== //
  //   EVENTS   //
  // ========== //

  onActiveInputStateChanged(listener: (state: ActiveInputState) => void) {
    return EventEmitter.addListener(Native.ACTIVE_INPUT_STATE_CHANGED, listener)
  }

  onMessage(namespace: string, listener: (message: string) => void) {
    return EventEmitter.addListener(
      Native.MESSAGE_RECEIVED,
      (ns, message) => namespace === ns && listener(message)
    )
  }

  onStandbyStateChanged(listener: (state: StandbyState) => void) {
    return EventEmitter.addListener(Native.STANDBY_STATE_CHANGED, listener)
  }
}

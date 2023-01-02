import { NativeEventEmitter, NativeModules } from 'react-native'
import ActiveInputState from '../types/ActiveInputState'
import ApplicationMetadata from '../types/ApplicationMetadata'
import Device from '../types/Device'
import StandbyState from '../types/StandbyState'
import CastChannel from './CastChannel'
import RemoteMediaClient from './RemoteMediaClient'

const { RNGCCastSession: Native } = NativeModules

/**
 * Cast sessions are created and managed automatically by the {@link SessionManager}, for example when the user selects a Cast device from the media route controller dialog. The current active CastSession can be accessed by {@link CastContext.getCurrentCastSession}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession)
 *
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castSession = useCastSession()
 *
 *   if (castSession) {
 *     // ...
 *   }
 * }
 * ```
 */
export default class CastSession {
  client = new RemoteMediaClient()

  /** Unique session ID. */
  id?: string

  constructor(args: { id?: string }) {
    this.id = args.id
  }

  /**
   * Creates a channel for sending custom messages between this sender and the Cast receiver. Use when you've built a custom receiver and want to communicate with it.
   *
   * @param namespace A custom channel identifier starting with `urn:x-cast:`, for example `urn:x-cast:com.reactnative.googlecast.example`. The namespace name is arbitrary; just make sure it's unique.
   */
  addChannel(namespace: string): Promise<CastChannel> {
    return CastChannel.add(namespace)
  }

  /**
   * Indicates whether a receiver device is currently the active video input.
   * Active input state can only be reported when the Google cast device is connected to a TV or AVR with CEC support.
   */
  getActiveInputState(): Promise<ActiveInputState> {
    return Native.getActiveInputState()
  }

  /**
   * Returns the metadata for the currently running receiver application, or `null` if the metadata is unavailable.
   *
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getApplicationMetadata()) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session.html#aa48324aeb26bd15ec3b7e052138ea48c) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getApplicationMetadata)
   */
  getApplicationMetadata(): Promise<ApplicationMetadata> {
    return Native.getApplicationMetadata()
  }

  /**
   * Returns the current receiver application status, if any. Message text is localized to the Google Cast device's locale.
   *
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getApplicationStatus()) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a1821f77bc0c0dc159419608105483a0a) _deviceStatusText_ | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getApplicationStatus)
   */
  getApplicationStatus(): Promise<string> {
    return Native.getApplicationStatus()
  }

  /**
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getCastDevice()) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a30d6130e558b235e37f1cbded2d27ce8) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession#getCastDevice)
   */
  getCastDevice(): Promise<Device | null> {
    return Native.getCastDevice()
  }

  getClient(): RemoteMediaClient {
    return this.client
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
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getVolume()) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#af4120ee98a679c4ed3abc6ba6b59cf12)
   */
  getVolume(): Promise<number> {
    return Native.getVolume()
  }

  /**
   * @returns {boolean}
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#isMute())
   */
  isMute(): Promise<boolean> {
    return Native.isMute()
  }

  /**
   * Listen for changes to the active input state.
   *
   * @example
   * ```js
   * const subscription = session.onActiveInputStateChanged(state => { ... })
   *
   * // later, to stop listening
   * subscription.remove()
   * ```
   */
  onActiveInputStateChanged(listener: (state: ActiveInputState) => void) {
    const eventEmitter = new NativeEventEmitter(Native)
    return eventEmitter.addListener(Native.ACTIVE_INPUT_STATE_CHANGED, listener)
  }

  /**
   * Listen for changes to the standby state.
   *
   * @example
   * ```js
   * const subscription = session.onStandbyStateChanged(state => { ... })
   *
   * // later, to stop listening
   * subscription.remove()
   * ```
   */
  onStandbyStateChanged(listener: (state: StandbyState) => void) {
    const eventEmitter = new NativeEventEmitter(Native)
    return eventEmitter.addListener(Native.STANDBY_STATE_CHANGED, listener)
  }

  /**
   * Mutes or unmutes the device's audio.
   *
   * Note that this method doesn't currently resolve a promise. You may instead call `client.setStreamMuted()` which handles promises correctly.
   *
   * @param mute The new mute state.
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setMute(boolean)) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#aac1dc4461b6d7ae6f1f5f9dc93cafebd)
   */
  setMute(mute: boolean): void {
    return Native.setMute(mute)
  }

  /**
   * Sets the device volume.
   *
   * Note that this method doesn't currently resolve a promise. You may instead call `client.setStreamVolume()` which handles promises correctly.
   *
   * @param volume If volume is outside of the range [0.0, 1.0], then the value will be clipped.
   * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setVolume(double)) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a68dcca2fdf1f4aebee394f0af56e7fb8)
   */
  setVolume(volume: number): void {
    return Native.setVolume(volume)
  }
}

import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'
import CastState from '../types/CastState'
import CastSession from './CastSession'
import RemoteMediaClient from './RemoteMediaClient'
import SessionManager from './SessionManager'

const { RNGCCastContext: Native } = NativeModules

const EventEmitter =
  Platform.OS === 'ios' ? new NativeEventEmitter(Native) : DeviceEventEmitter

/**
 * A singleton class containing global objects and state for the Cast SDK.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastContext} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_context} | [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastContext}
 */
export default class CastContext {
  /**
   * The current casting state for the application.
   */
  static getCastState(): Promise<CastState> {
    return Native.getCastState()
  }
  // TODO Changes to this property can be monitored with KVO or by listening for kGCKCastStateDidChangeNotification notifications.

  /** Returns the current session if it is an instance of {@link CastSession}, otherwise returns `null`. */
  static async getCurrentCastSession(): Promise<CastSession | null> {
    const manager = await CastContext.getSessionManager()
    return manager.getCurrentCastSession()
  }

  /**
   * Session manager manages interaction with receiver devices.
   */
  static getSessionManager(): Promise<SessionManager> {
    return Native.getSessionManager()
  }

  /**
   * Convenience method to get the RemoteMediaClient associated with current session.
   */
  static async getClient(): Promise<RemoteMediaClient> {
    const session = await this.getCurrentCastSession()
    return session.client
  }

  /**
   * If it has not been shown before, presents a fullscreen modal view controller that calls attention to the Cast button and displays some brief instructional text about its use.
   *
   * @returns `true` if the view controller was shown, `false` if it was not shown because it had already been shown before, or if the Cast Button was not found.
   */
  // TODO support passing button instance
  static showIntroductoryOverlay(): Promise<boolean> {
    return Native.showIntroductoryOverlay()
  }

  static onCastStateChanged(listener: (castState: CastState) => void) {
    return EventEmitter.addListener(Native.CAST_STATE_CHANGED, listener)
  }
}

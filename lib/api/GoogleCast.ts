import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'
import SessionManager from './SessionManager'

const { RNGoogleCast: Native } = NativeModules

/**
 * A singleton class containing global objects and state for the Cast SDK.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastContext} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_context} | [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastContext}
 */
export default class GoogleCast {
  /**
   * The current casting state for the application.
   */
  // TODO Changes to this property can be monitored with KVO or by listening for kGCKCastStateDidChangeNotification notifications.
  static getCastState(): Promise<
    'NoDevicesAvailable' | 'NotConnected' | 'Connecting' | 'Connected'
  > {
    return Native.getCastState()
  }
  /**
   *
   *
   * @static
   * @param {function(CastState): any} listener
   */
  // static addCastStateListener(listener) {
  //   GoogleCast.addCastStateListener(listener)
  // }

  /**
   * The session manager.
   *
   * This object manages the interaction with receiver devices.
   */
  static getSessionManager(): Promise<SessionManager> {
    return Native.getSessionManager()
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
}

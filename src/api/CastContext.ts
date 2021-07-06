import { NativeEventEmitter, NativeModules } from 'react-native'
import CastState from '../types/CastState'
import DiscoveryManager from './DiscoveryManager'
import SessionManager from './SessionManager'

const { RNGCCastContext: Native } = NativeModules
const EventEmitter = new NativeEventEmitter(Native)

/**
 * A root class containing global objects and state for the Cast SDK. It is the default export of this library.
 *
 * @example
 * ```js
 * import GoogleCast, { CastContext } from 'react-native-google-cast'
 * // GoogleCast and CastContext are equivalent
 * ```
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastContext) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_context) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastContext)
 */
export default class CastContext {
  /** The DiscoveryManager to manage device discovery. */
  static discoveryManager = new DiscoveryManager()

  /** The SessionManager that manages cast sessions. */
  static sessionManager = new SessionManager()

  /** The current casting state for the application. */
  static getCastState(): Promise<CastState> {
    return Native.getCastState()
  }

  /**
   * Get the DiscoveryManager to manage device discovery.
   */
  static getDiscoveryManager(): DiscoveryManager {
    return this.discoveryManager
  }

  /**
   * Get the SessionManager to manage cast sessions.
   */
  static getSessionManager(): SessionManager {
    return this.sessionManager
  }

  /**
   * Displays the Cast Dialog programmatically. Users can also open the Cast Dialog by clicking on a Cast Button.
   *
   * @returns `true` if the Cast Dialog was shown, `false` if it was not shown.
   */
  static showCastDialog(): Promise<boolean> {
    return Native.showCastDialog()
  }

  /**
   * Displays the Expanded Controls screen programmatically. Users can also open it by clicking on Mini Controls.
   *
   * @returns `true` if the Expanded Controls were shown, `false` if it was not shown.
   */
  static showExpandedControls(): Promise<boolean> {
    return Native.showExpandedControls()
  }

  /**
   * If it has not been shown before, presents a fullscreen modal view controller that calls attention to the Cast button and displays some brief instructional text about its use.
   *
   * By default, the overlay is only displayed once. To change this, pass `once: false` in the options.
   *
   * @returns Promise that becomes `true` if the view controller was shown, `false` if it was not shown because it had already been shown before, or if the Cast Button was not found.
   */
  static showIntroductoryOverlay(options?: {
    once?: boolean
  }): Promise<boolean> {
    return Native.showIntroductoryOverlay({ once: true, ...options })
  }

  /**
   * Listen for changes of the Cast State.
   *
   * @example
   * ```js
   * const subscription = CastContext.onCastStateChanged(castState => {
   *   if (castState === 'connected') {
   *     // ... ready to go
   *   }
   * })
   *
   * // later, to stop listening
   * subscription.remove()
   * ```
   */
  static onCastStateChanged(listener: (castState: CastState) => void) {
    return EventEmitter.addListener(Native.CAST_STATE_CHANGED, listener)
  }
}

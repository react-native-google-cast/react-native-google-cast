import { NativeEventEmitter, NativeModules } from 'react-native'
import type { CastState } from '../types/CastState'
import type CastSession from './CastSession'
import type RemoteMediaClient from './RemoteMediaClient'
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
  /** The current casting state for the application. */
  static getCastState(): Promise<CastState> {
    return Native.getCastState()
  }

  /**
   * Returns the current session if it is an instance of {@link CastSession}, otherwise returns `null` (if you manually create a custom {@link Session} with the {@link SessionManager}).
   */
  static async getCurrentCastSession(): Promise<CastSession | null> {
    return new SessionManager().getCurrentCastSession()
  }

  /**
   * Convenience method to get the RemoteMediaClient associated with current session.
   */
  static async getClient(): Promise<RemoteMediaClient | null> {
    const session = await this.getCurrentCastSession()
    return session ? session.client : null
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

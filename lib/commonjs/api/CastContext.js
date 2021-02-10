"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

var _DiscoveryManager = _interopRequireDefault(require("./DiscoveryManager"));

var _SessionManager = _interopRequireDefault(require("./SessionManager"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  RNGCCastContext: Native
} = _reactNative.NativeModules;
const EventEmitter = new _reactNative.NativeEventEmitter(Native);
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

class CastContext {
  /** The DiscoveryManager to manage device discovery (iOS only). */

  /** The SessionManager that manages cast sessions. */

  /** The current casting state for the application. */
  static getCastState() {
    return Native.getCastState();
  }
  /**
   * Get the DiscoveryManager to manage device discovery (iOS only).
   */


  static getDiscoveryManager() {
    return this.discoveryManager;
  }
  /**
   * Get the SessionManager to manage cast sessions.
   */


  static getSessionManager() {
    return this.sessionManager;
  }
  /**
   * Displays the Cast Dialog programmatically. Users can also open the Cast Dialog by clicking on a Cast Button.
   *
   * @returns `true` if the Cast Dialog was shown, `false` if it was not shown.
   */


  static showCastDialog() {
    return Native.showCastDialog();
  }
  /**
   * Displays the Expanded Controls screen programmatically. Users can also open it by clicking on Mini Controls.
   *
   * @returns `true` if the Expanded Controls were shown, `false` if it was not shown.
   */


  static showExpandedControls() {
    return Native.showExpandedControls();
  }
  /**
   * If it has not been shown before, presents a fullscreen modal view controller that calls attention to the Cast button and displays some brief instructional text about its use.
   *
   * By default, the overlay is only displayed once. To change this, pass `once: false` in the options.
   *
   * @returns Promise that becomes `true` if the view controller was shown, `false` if it was not shown because it had already been shown before, or if the Cast Button was not found.
   */


  static showIntroductoryOverlay(options) {
    return Native.showIntroductoryOverlay({
      once: true,
      ...options
    });
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


  static onCastStateChanged(listener) {
    return EventEmitter.addListener(Native.CAST_STATE_CHANGED, listener);
  }

}

exports.default = CastContext;

_defineProperty(CastContext, "discoveryManager", new _DiscoveryManager.default());

_defineProperty(CastContext, "sessionManager", new _SessionManager.default());
//# sourceMappingURL=CastContext.js.map
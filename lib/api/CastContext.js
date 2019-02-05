// @flow

/**
 @typedef CastState one of `NoDevicesAvailable`, `NotConnected`, `Connecting`, `Connected`
 */

/**
 * A singleton class containing global objects and state for the Cast SDK.
 *
 * @class CastContext
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastContext}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_context}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastContext}
 */
class CastContext {
  /**
   *
   * @static
   * @returns {Promise<CastState>}
   */
  static getCastState() {
    return GoogleCast.getCastState()
  }

  /**
   *
   *
   * @static
   * @param {function(CastState): any} listener
   */
  static addCastStateListener(listener) {
    GoogleCast.addCastStateListener(listener)
  }
}

export default CastContext

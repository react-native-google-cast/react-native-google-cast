// @flow

/**
 * An object representing a Cast receiver device.
 *
 * @class Device
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_device}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Receiver}
 */
export default class Device {
  constructor(options) {
    Object.assign(this, options)
  }
}

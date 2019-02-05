// @flow

/**
 * A class that represents an image that is located on a web server.
 *
 * Used for such things as {@link Device} icons and {@link MediaMetadata} artwork.
 *
 * @property {string} url The image URL.
 * @property {?number} height The image height, in pixels.
 * @property {?number} width The image width, in pixels.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/common/images/WebImage}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_image#af03b299c34947ba97027cf2603f95c4b}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Image}
 */
class WebImage {
  /**
   * Creates an instance of Image.
   * @param {{ url: string, height: ?number, width: ?number }} options
   */
  constructor(options) {
    Object.assign(this, options)
  }
}

export default WebImage

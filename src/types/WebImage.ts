/**
 * An image that is located on a web server.
 *
 * Used for such things as {@linkcode Device} icons and {@linkcode MediaMetadata} artwork.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/common/images/WebImage) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_image) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Image)
 */
export interface WebImage {
  /** The image URL. */
  url: string

  /** The image width, in pixels. */
  width?: number

  /** The image height, in pixels. */
  height?: number
}

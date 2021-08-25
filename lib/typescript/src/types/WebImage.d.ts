/**
 * A class that represents an image that is located on a web server.
 *
 * Used for such things as {@link Device} icons and {@link MediaMetadata} artwork.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/common/images/WebImage) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_image#af03b299c34947ba97027cf2603f95c4b) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Image)
 */
export default interface WebImage {
    /** The image height, in pixels. */
    height?: number;
    /** The image URL. */
    url: string;
    /** The image width, in pixels. */
    width?: number;
}

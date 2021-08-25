/**
 * A class that holds video properties of the current media session. The current `VideoInfo` can be obtained from {@link MediaStatus}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/VideoInfo) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_video_info) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.VideoInformation)
 */
export default interface VideoInfo {
    /** HDR type used in the video, if any. */
    hdrType?: 'DV' | 'HDR' | 'SDR';
    /** The video height, in pixels. */
    height?: number;
    /** The video width, in pixels. */
    width?: number;
}

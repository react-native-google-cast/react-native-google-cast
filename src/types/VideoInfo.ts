/**
 * The HDR type used by a video.
 *
 * @see {@linkcode VideoInfo.hdrType}
 */
export type VideoHdrType = 'DV' | 'HDR' | 'SDR'

/**
 * Video properties of the current media session.
 *
 * The current `VideoInfo` can be obtained from {@linkcode MediaStatus}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/VideoInfo) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_video_info) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.VideoInformation)
 */
export interface VideoInfo {
  /** HDR type used in the video, if any. */
  hdrType?: VideoHdrType

  /** The video width, in pixels. */
  width?: number

  /** The video height, in pixels. */
  height?: number
}

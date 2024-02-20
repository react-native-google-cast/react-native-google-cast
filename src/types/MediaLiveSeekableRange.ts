/**
 * A class that aggregates information about the seekable range of a media stream.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLiveSeekableRange) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_live_seekable_range) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.LiveSeekableRange)
 */
export default interface MediaLiveSeekableRange {
  /** End of the seekable range in seconds. */
  endTime: number

  /** A boolean value indicates whether the live seekable range is a moving window. */
  isMovingWindow: boolean

  /** A boolean value indicates whether a live stream is ended. */
  isLiveDone: boolean

  /** Start of the seekable range in seconds. */
  startTime: number
}

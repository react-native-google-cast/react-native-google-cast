/**
 * Aggregates information about the seekable range of a live media stream.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLiveSeekableRange) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_live_seekable_range) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.LiveSeekableRange)
 */
export interface MediaLiveSeekableRange {
  /** Start of the seekable range in seconds. */
  startTime: number

  /** End of the seekable range in seconds. */
  endTime: number

  /** Whether the live seekable range is a moving window. */
  isMovingWindow: boolean

  /** Whether the live stream has ended. */
  isLiveDone: boolean
}

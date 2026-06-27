/**
 * Enum defining the media queue types.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueData#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_queue_data) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.QueueType)
 */
export type MediaQueueType =
  /** A media type representing an album. */
  | 'album'
  /** A media type representing an audio book. */
  | 'audioBook'
  /** A media type representing a live TV. */
  | 'liveTv'
  /** A media type representing a movie. */
  | 'movie'
  /** A media type representing an audio playlist. */
  | 'playlist'
  /** A media type representing a radio station. */
  | 'radioStation'
  /** A media type representing a podcast series. */
  | 'podcastSeries'
  /** A media type representing a TV series. */
  | 'tvSeries'
  /** A media type representing a video playlist. */
  | 'videoPlaylist'

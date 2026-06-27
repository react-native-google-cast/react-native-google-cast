/**
 * Enum defining the media queue container metadata types.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueContainerMetadata#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_queue_container_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.ContainerType)
 */
export type MediaQueueContainerType =
  /** Generic template suitable for most media types. Used by default. */
  | 'generic'
  /** A media type representing an audio book. */
  | 'audioBook'

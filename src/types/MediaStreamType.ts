/**
 * The media stream type.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_information#a8c4a8f6f) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.StreamType)
 */
export type MediaStreamType =
  /** Stored media streamed from an existing data store. */
  | 'buffered'
  /** Live media generated on the fly. */
  | 'live'
  /** None of the above. */
  | 'other'

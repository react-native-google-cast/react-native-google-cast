/**
 * Possible reasons why a media is idle.
 *
 * Only meaningful when the media player state is `idle`.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_status#a2f8e3f3f) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.IdleReason)
 */
export type MediaPlayerIdleReason =
  /** A sender requested to stop playback using the STOP command. */
  | 'cancelled'
  /** The media was interrupted due to an error, for example if the player could not download the media due to network errors. */
  | 'error'
  /** The media playback completed. */
  | 'finished'
  /** A sender requested playing a different media using the LOAD command. */
  | 'interrupted'

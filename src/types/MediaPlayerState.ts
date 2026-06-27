/**
 * Possible states of the media player.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_status#a1f8e3f3f) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.PlayerState)
 */
export type MediaPlayerState =
  /** Player is in PLAY mode but not actively playing content. `streamPosition` will not change. */
  | 'buffering'
  /** No media is loaded into the player. */
  | 'idle'
  /** The media is loading. */
  | 'loading'
  /** The media is not playing. */
  | 'paused'
  /** The media is playing. */
  | 'playing'

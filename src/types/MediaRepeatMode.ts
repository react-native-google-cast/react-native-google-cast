/**
 * Possible states of queue repeat mode.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_status#a3f8e3f3f) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.RepeatMode)
 */
export type MediaRepeatMode =
  /** The items in the queue will be played indefinitely. When the last item has ended, the first item will be played again. */
  | 'all'
  /** The items in the queue will be played indefinitely. When the last item has ended, the list of items will be randomly shuffled by the receiver, and the queue will continue to play starting from the first item of the shuffled items. */
  | 'allAndShuffle'
  /** Items are played in order, and when the queue is completed (the last item has ended) the media session is terminated. */
  | 'off'
  /** The current item will be repeated indefinitely. */
  | 'single'

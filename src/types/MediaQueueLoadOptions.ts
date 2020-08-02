import { MediaRepeatMode } from './MediaRepeatMode'

/**
 * Options for loading media queue items with {@link RemoteMediaClient}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadOptions) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_options) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest)
 */
export default interface MediaQueueLoadOptions {
  /**  The custom application-specific data to pass along with the load request. */
  customData?: object

  /** The index of the item in the queue items array that should be played first. */
  startIndex?: number

  /**  The initial playback position for the first item in the queue items array when it is first played, relative to the beginning of the stream. This value is ignored when the same item is played again, for example when the queue repeats, or the item is later jumped to. In those cases the item's `startTime` is used. */
  playPosition?: number

  /**  The repeat mode for playing the queue. One of `All`, `AllAndShuffle`, `Single`, `Off`. */
  repeatMode?: MediaRepeatMode
}

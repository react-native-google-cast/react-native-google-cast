/**
 * Options for loading media queue items with {@link RemoteMediaClient}.
 *
 * @class MediaLoadOptions
 * @param {Object} options
 * @param {?number} options.startIndex The index of the item in the queue items array that should be played first.
 * @param {?number} options.playPosition The initial playback position for the first item in the queue items array when it is first played, relative to the beginning of the stream. This value is ignored when the same item is played again, for example when the queue repeats, or the item is later jumped to. In those cases the item's `startTime` is used.
 * @param {?string} options.repeatMode The repeat mode for playing the queue. One of `All`, `AllAndShuffle`, `Single`, `Off`.
 * @param {?Object} options.customData The custom application-specific data to pass along with the load request.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadOptions}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_options}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest}
 */
export default function MediaQueueLoadOptions(options) {
  Object.assign(this, options)
}

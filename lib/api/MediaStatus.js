// @flow

/**
 * A class that holds status information about some media or media queue. The current MediaStatus can be obtained from the RemoteMediaPlayer.
 *
 * Each media session is associated with a media queue on the receiver application. The list of media items in the current queue can be obtained from getQueueItems(). Media items are assigned a unique item ID. Accessors for individual item and values of properties of the queue are also provided here.
 *
 * getCurrentItemId(), getLoadingItemId() and getPreloadedItemId() tells which item is playing, which item is loading and which item has been preloaded on the receiver.
 *
 * @typedef {Object} MediaStatus
 * @property {string} idleReason The current idle reason. This value is only meaningful if the `playerState` is `Idle`. One of `Cancelled`, `Error`, `Finished`, `Interrupted`.
 * @property {boolean} isMuted
 * @property {MediaInfo} mediaInfo
 * @property {number} playbackRate Gets the current stream playback rate. This will be negative if the stream is seeking backwards, 0 if the stream is paused, 1 if the stream is playing normally, and some other positive value if the stream is seeking forwards.
 * @property {string} playerState The current player state. One of `Buffering`, `Idle`, `Loading`, `Playing`, `Paused`
 * @property {number} streamPosition The current stream position from the start of the stream, in milliseconds
 * @property {number} volume The stream's volume, between 0.0 and 1.0
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_status}
 */

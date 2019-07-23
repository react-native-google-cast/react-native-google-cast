import MediaInfo from './MediaInfo'

/**
 * A class that holds status information about some media or media queue. The current MediaStatus can be obtained from the {@link RemoteMediaPlayer}.
 *
 * Each media session is associated with a media queue on the receiver application. The list of media items in the current queue can be obtained from getQueueItems(). Media items are assigned a unique item ID. Accessors for individual item and values of properties of the queue are also provided here.
 *
 * getCurrentItemId(), getLoadingItemId() and getPreloadedItemId() tells which item is playing, which item is loading and which item has been preloaded on the receiver.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_status}
 */
export default class MediaStatus {
  /** The current idle reason. This value is only meaningful if the `playerState` is `Idle`. One of `Cancelled`, `Error`, `Finished`, `Interrupted`. */
  idleReason: 'Cancelled' | 'Error' | 'Finished' | 'Interrupted'
  /** The stream's mute state. */
  isMuted: boolean
  /** The current media information. */
  mediaInfo: MediaInfo
  /** Gets the current stream playback rate. This will be negative if the stream is seeking backwards, 0 if the stream is paused, 1 if the stream is playing normally, and some other positive value if the stream is seeking forwards. */
  playbackRate: number
  /** The current player state. One of `Buffering`, `Idle`, `Loading`, `Playing`, `Paused` */
  playerState: 'Buffering' | 'Idle' | 'Loading' | 'Playing' | 'Paused'
  /** The current stream position from the start of the stream, in milliseconds */
  streamPosition: number
  /** The stream's volume, between 0.0 and 1.0 */
  volume: number
}

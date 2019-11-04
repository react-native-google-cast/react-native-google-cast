import MediaInfo from './MediaInfo'
import MediaQueueItem from './MediaQueueItem'
import MediaRepeatMode from './MediaRepeatMode'
import VideoInfo from './VideoInfo'

/**
 * A class that holds status information about some media or media queue. The current `MediaStatus` can be obtained from the {@link RemoteMediaClient}.
 *
 * Each media session is associated with a media queue on the receiver application. The list of media items in the current queue can be obtained from `queueItems`. Media items are assigned a unique item ID. Accessors for individual item and values of properties of the queue are also provided here.
 *
 * `currentItemId`, `loadingItemId` and `preloadedItemId` tells which item is playing, which item is loading and which item has been preloaded on the receiver.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_status) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media)
 */
export default interface MediaStatus {
  /** The ID of the item that that is currently active in the queue (it may not be playing). */
  currentItemId?: number

  /** Any custom data that is associated with the media item. */
  customData?: object

  /** The current idle reason. This value is only meaningful if the `playerState` is `Idle`. One of `cancelled`, `error`, `finished`, `interrupted`. */
  idleReason: 'cancelled' | 'error' | 'finished' | 'interrupted'

  /** The stream's mute state. */
  isMuted: boolean

  /** The ID of the item that is currently loading (but isn't active in the queue) on the receiver. */
  loadingItemId?: number

  /** The current media information. */
  mediaInfo: MediaInfo

  /** Gets the current stream playback rate. This will be negative if the stream is seeking backwards, 0 if the stream is paused, 1 if the stream is playing normally, and some other positive value if the stream is seeking forwards. */
  playbackRate: number

  /** The current player state. One of `buffering`, `idle`, `loading`, `playing`, `paused` */
  playerState: 'buffering' | 'idle' | 'loading' | 'playing' | 'paused'

  /** ID of the next Item, only available if it has been preloaded. On the receiver media items can be preloaded and cached temporarily in memory, so when they are loaded later on, the process is faster (as the media does not have to be fetched from the network). */
  preloadedItemId?: number

  /** Readonly list of items in the queue. */
  queueItems: MediaQueueItem[]

  /** The repeat mode for playing the queue. */
  queueRepeatMode?: MediaRepeatMode

  /** The current stream position from the start of the stream, in milliseconds */
  streamPosition: number

  /** The video information. */
  videoInfo: VideoInfo

  /** The stream's volume, between 0.0 and 1.0 */
  volume: number
}

import type { AnyMap } from 'react-native-nitro-modules'
import type { MediaInfo } from './MediaInfo'

/**
 * A media queue item.
 *
 * Used in two-way communication between sender and receiver. The sender constructs them to
 * load or insert media on the receiver; the {@linkcode MediaStatus} from the receiver also
 * contains the list of items as this type. Once loaded, the receiver assigns a unique
 * `itemId` to each item, even if the same media is loaded multiple times.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueItem) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_item) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.QueueItem)
 */
export interface MediaQueueItem {
  /** The media information associated with this item. */
  mediaInfo: MediaInfo

  /**
   * Unique identifier of the item in the queue. Must be `undefined` for QueueLoad/QueueInsert
   * (the receiver assigns it); mandatory for other operations.
   */
  itemId?: number

  /**
   * Array of {@linkcode MediaTrack} IDs that should be active. The IDs must come from
   * `mediaInfo.mediaTracks[].id`. Incompatible IDs (e.g. two audio tracks) fail with
   * `INVALID_PARAMETER`.
   */
  activeTrackIds?: number[]

  /**
   * Whether the item should automatically start playback when it becomes the current item.
   * If `false`, the queue pauses when it reaches this item. Defaults to `true`.
   */
  autoplay?: boolean

  /** The playback duration for the item, in seconds, or `undefined` to use the stream's actual duration. */
  playbackDuration?: number

  /**
   * A hint, in seconds, for how long before this item plays the receiver should preload it,
   * for a smooth transition between queue items. Only positive values are valid; the receiver
   * tries to honor but does not guarantee it.
   */
  preloadTime?: number

  /** Number of seconds from the beginning of the media to start playback. */
  startTime?: number

  /** Custom data, if any. */
  customData?: AnyMap
}

import type { MediaQueueContainerMetadata } from './MediaQueueContainerMetadata'
import type { MediaQueueItem } from './MediaQueueItem'
import type { MediaQueueType } from './MediaQueueType'
import type { MediaRepeatMode } from './MediaRepeatMode'

/**
 * Holds the information of the playing queue or media container.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueData) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_data) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.QueueData)
 */
export interface MediaQueueData {
  /** ID of the queue. */
  id?: string

  /** Display name of the queue. */
  name?: string

  /**
   * The deep link for the media as used by Google Assistant, if any (for example the deep
   * link of an album, playlist, or radio station).
   */
  entity?: string

  /** Type of the queue. */
  type?: MediaQueueType

  /** How to repeat the queue. */
  repeatMode?: MediaRepeatMode

  /** Additional description for the queue, including optional section metadata, images, etc. */
  containerMetadata?: MediaQueueContainerMetadata

  /** The items to be loaded in the queue. */
  items?: MediaQueueItem[]

  /** The index of the item in the queue to start playback from. Only valid for load requests. */
  startIndex?: number

  /**
   * Seconds (since the beginning of content) to start playback of the first item. Only valid
   * for load requests.
   */
  startTime?: number
}

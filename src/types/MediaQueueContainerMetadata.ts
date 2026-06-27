import type { MediaMetadata } from './MediaMetadata'
import type { MediaQueueContainerType } from './MediaQueueContainerType'
import type { WebImage } from './WebImage'

/**
 * Additional metadata for the media queue container.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueContainerMetadata) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_container_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.ContainerMetadata)
 */
export interface MediaQueueContainerMetadata {
  /** The type of container metadata. */
  containerType?: MediaQueueContainerType

  /** The container title, e.g. audiobook title, live TV channel name, album or playlist name. */
  title?: string

  /** The total playback time, in seconds. */
  containerDuration?: number

  /**
   * Images associated with the queue. By default the first image is used when displaying
   * queue information (audiobook image, TV channel logo, album cover, etc.).
   */
  containerImages?: WebImage[]

  /** The metadata of each section that a media stream contains. */
  sections?: MediaMetadata[]
}

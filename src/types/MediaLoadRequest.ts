import type { AnyMap } from 'react-native-nitro-modules'
import type { MediaInfo } from './MediaInfo'
import type { MediaQueueData } from './MediaQueueData'

/**
 * Options for loading media with `RemoteMediaClient.loadMedia`.
 *
 * Provide either {@linkcode MediaLoadRequest.mediaInfo} (single item) or
 * {@linkcode MediaLoadRequest.queueData} (a queue of items).
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadRequestData) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_request_data) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest)
 */
export interface MediaLoadRequest {
  /** The media item to load. Either this or `queueData` is required. */
  mediaInfo?: MediaInfo

  /** The metadata of the media item or queue to load. Either this or `mediaInfo` is required. */
  queueData?: MediaQueueData

  /**
   * Whether playback should start immediately. Defaults to `true`.
   *
   * When omitted while loading a queue, the first queue item's `autoplay` property determines
   * whether to play automatically.
   */
  autoplay?: boolean

  /** The initial playback position, in seconds from the beginning of the media. */
  startTime?: number

  /**
   * The playback rate, as a multiplier of the normal playback rate. Accepted values are
   * between `0.5` and `2.0`; the normal playback rate is `1.0`.
   */
  playbackRate?: number

  /** Application-specific user credentials to pass along with the load request. */
  credentials?: string

  /** Application-specific user credentials type to pass along with the load request. */
  credentialsType?: string

  /** Custom application-specific data to pass along with the load request. */
  customData?: AnyMap
}

import type { AnyMap } from 'react-native-nitro-modules'
import type { MediaInfo } from './MediaInfo'
import type { MediaLiveSeekableRange } from './MediaLiveSeekableRange'
import type { MediaPlayerIdleReason } from './MediaPlayerIdleReason'
import type { MediaPlayerState } from './MediaPlayerState'
import type { MediaQueueItem } from './MediaQueueItem'
import type { MediaRepeatMode } from './MediaRepeatMode'
import type { VideoInfo } from './VideoInfo'

/**
 * Holds status information about some media or media queue.
 *
 * The current `MediaStatus` can be obtained using `getMediaStatus` / `onMediaStatusUpdated`
 * on `RemoteMediaClient`, or via the `useMediaStatus` hook. Each media session is associated
 * with a media queue on the receiver; `currentItemId`, `loadingItemId`, and `preloadedItemId`
 * indicate which item is playing, loading, and preloaded.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaStatus) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_status) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.Media)
 */
export interface MediaStatus {
  /** The current media information. */
  mediaInfo?: MediaInfo

  /** The current player state. */
  playerState?: MediaPlayerState

  /** The current idle reason. Only meaningful when `playerState` is `idle`. */
  idleReason?: MediaPlayerIdleReason

  /** The current stream position from the start of the stream, in seconds. */
  streamPosition: number

  /**
   * The current stream playback rate. Negative when seeking backwards, 0 when paused, 1 when
   * playing normally, and some other positive value when seeking forwards.
   */
  playbackRate: number

  /** The stream's volume, between 0.0 and 1.0. */
  volume: number

  /** The stream's mute state. */
  isMuted: boolean

  /** The list of active {@linkcode MediaTrack} IDs. */
  activeTrackIds?: number[]

  /** The video information, if it was received from the receiver. */
  videoInfo?: VideoInfo

  /** The seekable range of a live media stream. Absent if the current media is not a seekable live stream. */
  liveSeekableRange?: MediaLiveSeekableRange

  /**
   * The queue items the receiver reported in this status update.
   *
   * Note that this is only a limited window of the queue around the current item (typically the
   * previous, current, and next items) — not the full queue. Full-queue access via a paged
   * `MediaQueue` API is planned for v5.x; see
   * [#618](https://github.com/react-native-google-cast/react-native-google-cast/issues/618).
   *
   * The window can also be *narrower* than what the receiver reported: right after a queue
   * mutation the receiver may name entries by `itemId` alone, before it has populated their
   * media. Such entries cannot be represented (`mediaInfo` is required) and are omitted from
   * this array on Android, so treat a shrinking `queueItems` between two status updates as a
   * reporting artefact rather than evidence that items left the queue.
   */
  queueItems: MediaQueueItem[]

  /** The `itemId` of the {@linkcode MediaQueueItem} currently active in the queue (it may not be playing). */
  currentItemId?: number

  /** The `itemId` of the {@linkcode MediaQueueItem} currently loading (but not yet active). */
  loadingItemId?: number

  /** The `itemId` of the next preloaded {@linkcode MediaQueueItem}, if any. */
  preloadedItemId?: number

  /** The repeat mode for playing the queue. */
  queueRepeatMode?: MediaRepeatMode

  /** Any custom data associated with the media item. */
  customData?: AnyMap
}

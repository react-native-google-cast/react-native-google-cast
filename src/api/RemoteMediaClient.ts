import { NativeModules } from 'react-native'
import type MediaInfo from '../types/MediaInfo'
import type MediaLoadOptions from '../types/MediaLoadOptions'
import type MediaQueueItem from '../types/MediaQueueItem'
import type MediaStatus from '../types/MediaStatus'

const { RNGCRemoteMediaClient: Native } = NativeModules

// const EventEmitter = new NativeEventEmitter(Native)

/**
 * Class for controlling a media player application running on a Cast receiver.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client) _GCKRemoteMediaClient_  | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer) _RemotePlayer_
 */
export default class RemoteMediaClient {
  static getCurrent(): RemoteMediaClient {
    return new RemoteMediaClient()
  }

  // getMediaQueue(): Promise<MediaQueue> {
  // }

  /**
   * The current media status, or `null` if there isn't a media session.
   */
  getMediaStatus(): Promise<MediaStatus | null> {
    return Native.getMediaStatus()
  }

  /**
   * Loads and starts playback of a media item or a queue of media items with a request data.
   *
   * @example
   * ```ts
   * RemoteMediaClient.loadMedia(
   *   {
   *     contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
   *   },
   *   {
   *     autoplay: true,
   *   }
   * )
   * ```
   */
  loadMedia(
    mediaInfo: MediaInfo,
    mediaLoadOptions: MediaLoadOptions = {}
  ): Promise<void> {
    return Native.loadMedia(mediaInfo, mediaLoadOptions)
  }

  /**
   * Pauses playback of the current media item.
   *
   * The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  pause(customData?: object): Promise<void> {
    return Native.pause(customData)
  }

  /**
   * Begins (or resumes) playback of the current media item.
   *
   * Playback always begins at the beginning of the stream. The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  play(customData?: object): Promise<void> {
    return Native.play(customData)
  }

  /**
   * Inserts a single item into the queue and starts playing it at the specified position.
   *
   * @param item The item to insert.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
   * @param playPosition The initial playback position for the item when it is first played, relative to the beginning of the stream. This value is ignored when the same item is played again, for example when the queue repeats, or the item is later jumped to. In those cases the item's `startTime` is used.
   * @param customData Custom application-specific data to pass along with the request.
   */
  queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId?: number,
    playPosition?: number,
    customData?: object
  ): Promise<void> {
    return Native.queueInsertAndPlayItem(
      item,
      beforeItemId || 0,
      playPosition || 0,
      customData
    )
  }

  /**
   * Inserts a single item into the queue.
   *
   * @param item The item to insert.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
   * @param customData Custom application-specific data to pass along with the request.
   */
  queueInsertItem(
    item: MediaQueueItem,
    beforeItemId?: number,
    customData?: object
  ) {
    return this.queueInsertItems([item], beforeItemId, customData)
  }

  /**
   * Inserts a list of new media items into the queue.
   *
   * @param items List of items to insert into the queue, in the order that they should be played. The `itemId` field of the items should be unassigned.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted list. If the value is `null`, or does not refer to any item currently in the queue, the inserted list will be appended to the end of the queue.
   * @param customData Custom application-specific data to pass along with the request.
   */
  queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId?: number,
    customData?: object
  ): Promise<void> {
    return Native.queueInsertItems(items, beforeItemId || 0, customData)
  }

  /**
   * Seeks to a new position within the current media item.
   */
  seek(options: {
    /** Custom application-specific data to pass along with the request. */
    customData?: object
    /** Whether seek to end of stream or live. _On iOS, only supported from SDK v4.4.1._ */
    infinite?: boolean
    /** The position to seek to, in milliseconds from the beginning of the stream. Ignored if `infinite` is `true`. */
    position?: number
    /** The action to take after the seek operation has finished. If not specified, it will preserve current play state. */
    resumeState?: 'play' | 'pause'
  }): Promise<void> {
    return Native.seek(options)
  }

  /**
   * Sets the playback rate for the current media session.
   *
   * @param playbackRate The new playback rate, between `0.5` and `2.0`. The normal rate is `1.0`.
   * @param customData Custom application-specific data to pass along with the request.
   */
  setPlaybackRate(playbackRate: number, customData?: object): Promise<void> {
    return Native.setPlaybackRate(playbackRate, customData)
  }

  /**
   * Sets whether the stream is muted.
   *
   * The request will fail if there is no current media session.
   *
   * @param muted Whether the stream should be muted or unmuted.
   * @param customData Custom application-specific data to pass along with the request.
   */
  setStreamMuted(muted: boolean, customData?: object): Promise<void> {
    return Native.setStreamMuted(muted, customData)
  }

  /**
   * Sets the stream volume.
   *
   * @param playbackRate The new volume, between `0.0` and `1.0`.
   * @param customData Custom application-specific data to pass along with the request.
   */
  setStreamVolume(volume: number, customData?: object): Promise<void> {
    return Native.setStreamVolume(volume, customData)
  }

  /**
   * Stops playback of the current media item.
   *
   * If a queue is currently loaded, it will be removed. The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  stop(customData?: object): Promise<void> {
    return Native.stop(customData)
  }
}

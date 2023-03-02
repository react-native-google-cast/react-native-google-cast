import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native'
import MediaLoadRequest from '../types/MediaLoadRequest'
import MediaPlayerIdleReason from '../types/MediaPlayerIdleReason'
import MediaPlayerState from '../types/MediaPlayerState'
import MediaQueueItem from '../types/MediaQueueItem'
import MediaSeekOptions from '../types/MediaSeekOptions'
import MediaStatus from '../types/MediaStatus'
import TextTrackStyle from '../types/TextTrackStyle'

const { RNGCRemoteMediaClient: Native } = NativeModules

/**
 * Class for controlling a media player application running on a Cast receiver.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client) _GCKRemoteMediaClient_  | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer) _RemotePlayer_
 *
 * @example
 * ```js
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   if (client) {
 *     // ...
 *   }
 * }
 * ```
 */
export default class RemoteMediaClient {
  // getMediaQueue(): Promise<MediaQueue> {
  // }

  /**
   * The current media status, or `null` if there isn't a media session.
   */
  getMediaStatus(): Promise<MediaStatus | null> {
    return Native.getMediaStatus()
  }

  /**
   * The current stream position, or `null` if there isn't a media session.
   */
  getStreamPosition(): Promise<number | null> {
    return Native.getStreamPosition()
  }

  /**
   * Requests updated media status information from the receiver.
   */
  requestStatus(): Promise<void> {
    return Native.requestStatus()
  }

  /**
   * Loads and starts playback of a media item or a queue of media items with a request data.
   *
   * @example
   * ```ts
   * client.loadMedia({
   *   autoplay: true,
   *   mediaInfo: {
   *     contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
   *   }
   * })
   * ```
   */
  loadMedia(request: MediaLoadRequest): Promise<void> {
    return Native.loadMedia(request)
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
    beforeItemId?: number | null,
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
    beforeItemId?: number | null,
    customData?: object
  ): Promise<void> {
    return Native.queueInsertItems(items, beforeItemId || 0, customData)
  }

  /**
   * Moves to the next item in the queue.
   *
   * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
   */
  queueNext(customData?: object): Promise<void> {
    return Native.queueNext(customData)
  }

  /**
   * Moves to the previous item in the queue.
   *
   * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
   */
  queuePrev(customData?: object): Promise<void> {
    return Native.queuePrev(customData)
  }

  /**
   * Seeks to a new position within the current media item.
   */
  seek(options: MediaSeekOptions): Promise<void> {
    return Native.seek(options)
  }

  /**
   * @deprecated Use `setActiveTrackIds` instead.
   */
  setActiveMediaTracks(trackIds: number[] = []): Promise<void> {
    return Native.setActiveTrackIds(trackIds)
  }

  /**
   * Sets the active media tracks.
   *
   * The request will fail if there is no current media status.
   *
   * @param trackIds The media track IDs. If `undefined` or an empty array, the current set of active trackIds will be removed, and default ones will be used instead.
   */
  setActiveTrackIds(trackIds: number[] = []): Promise<void> {
    return Native.setActiveTrackIds(trackIds)
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
   * @param volume The new volume, between `0.0` and `1.0`.
   * @param customData Custom application-specific data to pass along with the request.
   */
  setStreamVolume(volume: number, customData?: object): Promise<void> {
    return Native.setStreamVolume(volume, customData)
  }

  /**
   * Sets the text track style.
   *
   * The request will fail if there is no current media status.
   *
   * @param textTrackStyle The text track style.
   */
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void> {
    return Native.setTextTrackStyle(textTrackStyle)
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

  // ========== //
  //   EVENTS   //
  // ========== //

  /** Called when media status changes. */
  onMediaStatusUpdated(handler: (mediaStatus: MediaStatus | null) => void) {
    const eventEmitter = new NativeEventEmitter(Native)
    return eventEmitter.addListener(Native.MEDIA_STATUS_UPDATED, handler)
  }

  /** Called when finished playback of an item. */
  onMediaPlaybackEnded(handler: (mediaStatus: MediaStatus | null) => void) {
    let currentItemId: number | undefined
    let playbackEnded = false

    return this.onMediaStatusUpdated((mediaStatus) => {
      if (currentItemId !== mediaStatus?.currentItemId) {
        currentItemId = mediaStatus?.currentItemId
        playbackEnded = false
      }
      if (playbackEnded) return
      if (mediaStatus?.idleReason !== MediaPlayerIdleReason.FINISHED) return

      playbackEnded = true
      handler(mediaStatus)
    })
  }

  /** Called when started playback of an item. */
  onMediaPlaybackStarted(handler: (mediaStatus: MediaStatus | null) => void) {
    let currentItemId: number | undefined
    let playbackStarted = false

    return this.onMediaStatusUpdated((mediaStatus) => {
      if (currentItemId !== mediaStatus?.currentItemId) {
        currentItemId = mediaStatus?.currentItemId
        playbackStarted = false
      }
      if (playbackStarted) return
      if (mediaStatus?.playerState !== MediaPlayerState.PLAYING) return

      playbackStarted = true
      handler(mediaStatus)
    })
  }

  private progressUpdateListener?: EmitterSubscription

  /**
   * Listen for updates on the progress of the currently playing media. Only one listener can be attached; when you attach another listener, the previous one will be removed. All times are in seconds.
   *
   * @param handler called when progress or duration of the currently playing media changes.
   * @param interval update frequency (defaults to 1 second)
   */
  onMediaProgressUpdated(
    handler: (progress: number, duration: number) => void,
    interval: number = 1
  ) {
    Native.setProgressUpdateInterval(interval)

    const eventEmitter = new NativeEventEmitter(Native)

    this.progressUpdateListener?.remove()
    this.progressUpdateListener = eventEmitter.addListener(
      Native.MEDIA_PROGRESS_UPDATED,
      ([progress, duration]) => handler(progress, duration)
    )

    return {
      remove: () => {
        Native.setProgressUpdateInterval(0)
        this.progressUpdateListener?.remove()
        this.progressUpdateListener = undefined
      },
    }
  }
}

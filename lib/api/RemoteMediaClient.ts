import { NativeModules } from 'react-native'
import MediaInfo from '../types/MediaInfo'
import MediaLoadOptions from '../types/MediaLoadOptions'

const { RNGCRemoteMediaClient: Native } = NativeModules

// TODO use the same native event interface instead of hacking it here
// EventEmitter:
//   Platform.OS === 'ios'
//     ? new NativeEventEmitter(GoogleCast)
//     : DeviceEventEmitter

/**
 * Class for controlling a media player application running on a Cast receiver.
 *
 * @see [RemoteMediaClient]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient} (Android)
 * @see [GCKRemoteMediaClient]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client} (iOS)
 * @see [RemotePlayer]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer} (Chrome)
 */
export default class RemoteMediaClient {
  static getCurrent(): RemoteMediaClient {
    return new RemoteMediaClient()
  }

  // mediaQueue: MediaQueue
  // mediaStatus: MediaStatus

  /**
   * Loads and starts playback of a media item or a queue of media items with a request data.
   *
   * @example
   * ```ts
   * RemoteMediaClient.loadMedia(
   *   new MediaInfo({
   *     contentId: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
   *   }),
   *   new MediaLoadOptions({
   *     autoplay: true,
   *   })
   * )
   * ```
   */
  loadMedia(
    mediaInfo: MediaInfo,
    mediaLoadOptions?: MediaLoadOptions
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
   * Seeks to a new position within the current media item.
   * The request will fail if there is no current media status.
   */
  seek(options: {
    /** Custom application-specific data to pass along with the request. */
    customData?: object
    /** The time interval by which to seek. */
    interval: number
    /** Whether the time interval is relative to the current stream position (`true`) or to the beginning of the stream (`false`). The default value is `false`, indicating an absolute seek position. */
    relative?: boolean
    /** The action to take after the seek operation has finished. The default value is `Unchanged`. */
    resumeState?: 'Play' | 'Pause'
  }): Promise<void> {
    return Native.seek(options)
  }

  /**
   * Sets the playback rate for the current media session.
   *
   * @param playbackRate The new playback rate, which must be between `0.5` and `2.0`. The normal rate is `1.0`.
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

import type { AnyMap } from 'react-native-nitro-modules'
import type { MediaHlsSegmentFormat } from './MediaHlsSegmentFormat'
import type { MediaHlsVideoSegmentFormat } from './MediaHlsVideoSegmentFormat'
import type { MediaMetadata } from './MediaMetadata'
import type { MediaStreamType } from './MediaStreamType'
import type { MediaTrack } from './MediaTrack'
import type { TextTrackStyle } from './TextTrackStyle'

/**
 * Aggregates information about a media item.
 *
 * Used by `RemoteMediaClient.loadMedia` to load media on the receiver application.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_information) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaInfo)
 */
export interface MediaInfo {
  /** The URL of the content to be played. */
  contentUrl: string

  /** The content ID for this stream. Defaults to `contentUrl` if not provided. */
  contentId?: string

  /** The content (MIME) type. */
  contentType?: string

  /** The deep link for the media as used by Google Assistant, if any. */
  entity?: string

  /**
   * The stream type. Defaults to `buffered` on every platform when omitted —
   * the native SDKs would otherwise leave it unset, which some receivers
   * reject, while the Chrome sender SDK already defaults to buffered. Set it
   * explicitly for live content.
   */
  streamType?: MediaStreamType

  /**
   * The media item metadata.
   *
   * Optional, but **set it if you want the Android media notification.** The
   * Cast SDK builds that notification (and the lock-screen controls) from the
   * metadata's title and images, and posts nothing at all when `metadata` is
   * absent — verified on device 2026-08-04 by loading the same URL through the
   * same `loadMedia` call with and without it: `{contentUrl}` and
   * `{contentUrl, contentType, streamType}` both produce no notification, while
   * adding `metadata` makes it appear. Media still casts and plays either way,
   * so this fails silently and looks like broken notification support.
   */
  metadata?: MediaMetadata

  /** The length of the stream, in seconds, or `undefined` if it is a live stream. */
  streamDuration?: number

  /** The media tracks for this stream. */
  mediaTracks?: MediaTrack[]

  /** The text track style for this stream. */
  textTrackStyle?: TextTrackStyle

  /** The format of the HLS audio segments. */
  hlsSegmentFormat?: MediaHlsSegmentFormat

  /** The format of the HLS video segments. */
  hlsVideoSegmentFormat?: MediaHlsVideoSegmentFormat

  /** The custom data, if any. */
  customData?: AnyMap
}

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

  /** The stream type. */
  streamType?: MediaStreamType

  /** The media item metadata. */
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

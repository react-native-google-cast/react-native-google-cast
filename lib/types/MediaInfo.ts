import * as MediaMetadata from './MediaMetadata'
import MediaTrack from './MediaTrack'
import TextTrackStyle from './TextTrackStyle'

/**
 * A type that aggregates information about a media item.
 *
 * Used by {@link RemoteMediaClient.loadMedia} to load media on the receiver application.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_information) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaInfo)
 */
export default interface MediaInfo {
  // /** The list of ad break clips in this content. */
  // adBreakClips?: AdBreakClipInfo[]

  // /** The list of ad breaks in this content. */
  // adBreaks?: AdBreakInfo[]

  /** The content (MIME) type. */
  contentType?: string

  /** The URL of the content to be played. */
  contentUrl: string

  /** The custom data, if any */
  customData?: object

  /** The deep link for the media as used by Google Assistant, if any. */
  entity?: string

  /** The media tracks for this stream. */
  mediaTracks?: MediaTrack[]

  /** The media item metadata. */
  metadata?:
    | MediaMetadata.Generic
    | MediaMetadata.Movie
    | MediaMetadata.MusicTrack
    | MediaMetadata.Photo
    | MediaMetadata.TvShow
    | MediaMetadata.User

  /** The length of the stream, in seconds, or `null` if it is a live stream. */
  streamDuration?: number

  /** The stream type. One of `buffered`, `live`, `none`. */
  streamType?: 'buffered' | 'live' | 'none'

  /** The text track style for this stream. */
  textTrackStyle?: TextTrackStyle

  // /** The VMAP request configuration if any. */
  // vmapAdsRequest?: VastAdsRequest
}

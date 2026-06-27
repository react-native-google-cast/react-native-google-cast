import type { AnyMap } from 'react-native-nitro-modules'

/**
 * The type of a {@linkcode MediaTrack}.
 *
 * @see {@linkcode MediaTrack.type}
 */
export type MediaTrackType = 'audio' | 'text' | 'video'

/**
 * The subtype of a text {@linkcode MediaTrack}. Applies only to text tracks.
 *
 * @see {@linkcode MediaTrack.subtype}
 */
export type MediaTrackSubtype =
  | 'captions'
  | 'chapters'
  | 'descriptions'
  | 'metadata'
  | 'subtitles'

/**
 * A media track, such as a language track or closed-caption text track in a video.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaTrack) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_track)
 */
export interface MediaTrack {
  /** The unique ID of the media track. Used for setting active track IDs. */
  id: number

  /** The type of the track. */
  type: MediaTrackType

  /** The content ID (URI) of the media track. */
  contentId?: string

  /** The content type (MIME type) of the media track. */
  contentType?: string

  /**
   * The language of this media track in RFC-5646 format. Required for `subtitles`
   * type but optional otherwise.
   */
  language?: string

  /** The name of the media track. */
  name?: string

  /** The text track's subtype; applies only to text tracks. */
  subtype?: MediaTrackSubtype

  /** The custom data object for this media track. */
  customData?: AnyMap
}

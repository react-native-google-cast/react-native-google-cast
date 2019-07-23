/**
 * A type that represents a media track, such as a language track or closed caption text track in a video.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaTrack} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_track}
 */
export default class MediaTrack {
  /** The content ID of the media track. */
  contentId?: string
  /** The unique ID of the media track. */
  id: number
  /** The content type (MIME type) of the media track, or null if none was specified. */
  contentType?: string
  /** The type of the track. One of `Audio`, `Text`, `Video`. */
  type: 'Audio' | 'Text' | 'Video'
  /** The text track's subtype; applies only to text tracks. One of `Captions`, `Chapters`, `Descriptions`, `Metadata`, `Subtitles`. */
  subtype?: 'Captions' | 'Chapters' | 'Descriptions' | 'Metadata' | 'Subtitles'
  /** The name of the media track, or null if none was specified. */
  name?: string
  /** The language of this media track in RFC-5464 format, or null if none was specified. */
  languageCode?: string
  /** The custom data object for this media track, or null if none was specified. */
  customData?: object

  constructor(params: {
    /** The content ID of the media track. */
    contentId?: string
    /** The unique ID of the media track. */
    id: number
    /** The content type (MIME type) of the media track, or null if none was specified. */
    contentType?: string
    /** The type of the track. One of `Audio`, `Text`, `Video`. */
    type: 'Audio' | 'Text' | 'Video'
    /** The text track's subtype; applies only to text tracks. One of `Captions`, `Chapters`, `Descriptions`, `Metadata`, `Subtitles`. */
    subtype?:
      | 'Captions'
      | 'Chapters'
      | 'Descriptions'
      | 'Metadata'
      | 'Subtitles'
    /** The name of the media track, or null if none was specified. */
    name?: string
    /** The language of this media track in RFC-5464 format, or null if none was specified. */
    languageCode?: string
    /** The custom data object for this media track, or null if none was specified. */
    customData?: object
  }) {
    Object.assign(this, params)
  }
}

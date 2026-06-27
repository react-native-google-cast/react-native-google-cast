import type { AnyMap } from 'react-native-nitro-modules'
import type { MediaMetadataType } from './MediaMetadataType'
import type { WebImage } from './WebImage'

/**
 * Container for media metadata.
 *
 * This is a flat struct whose {@linkcode MediaMetadata.type} discriminant selects which
 * fields are meaningful. It mirrors the native Cast model (a metadata type plus a keyed
 * field bag) rather than a per-type subclass. The ergonomic per-type union
 * (`Generic | Movie | MusicTrack | …`) is provided as a higher-level façade type;
 * this is the shape that crosses the native boundary.
 *
 * Fields that do not apply to the selected `type` are ignored by the receiver.
 *
 * @see {@linkcode MediaMetadataType}
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaMetadata) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaMetadata)
 */
export interface MediaMetadata {
  /** Media type. Selects which of the optional fields below are meaningful. */
  type: MediaMetadataType

  /** List of images, e.g. a poster image, album cover, or photo. */
  images?: WebImage[]

  /** The title (`generic`, `movie`, `musicTrack`, `photo`) or episode title (`tvShow`). */
  title?: string

  /** The subtitle (`generic`, `movie`). */
  subtitle?: string

  /** The name of the artist (`generic`, `musicTrack`) or photographer (`photo`). */
  artist?: string

  /**
   * The release date in ISO-8601 format, e.g. `2008-04-10` or `2018-04-10T12:40:00`
   * (`generic`, `movie`, `musicTrack`, `tvShow`).
   */
  releaseDate?: string

  /** The name of the movie studio that produced the movie (`movie`). */
  studio?: string

  /** The title of the album that the music track belongs to (`musicTrack`). */
  albumTitle?: string

  /**
   * The name of the artist who produced an album. For compilation albums such as DJ
   * mixes this is not necessarily the same as the per-track artist (`musicTrack`).
   */
  albumArtist?: string

  /** The name of the composer of the music track (`musicTrack`). */
  composer?: string

  /** The disc number (counting from 1) in a multi-disc album (`musicTrack`). */
  discNumber?: number

  /** The track number on an album disc (`musicTrack`). May be 0 for a hidden track. */
  trackNumber?: number

  /** The creation date of the photo in ISO-8601 format (`photo`). */
  creationDate?: string

  /** Location where the photo was taken, e.g. "Seattle, Washington, USA" (`photo`). */
  location?: string

  /** The latitude where the photograph was taken (`photo`). */
  latitude?: number

  /** The longitude where the photograph was taken (`photo`). */
  longitude?: number

  /** Photo width, in pixels (`photo`). */
  width?: number

  /** Photo height, in pixels (`photo`). */
  height?: number

  /** The date the TV show episode was first aired, in ISO-8601 format (`tvShow`). */
  broadcastDate?: string

  /** The episode number in a given season. May be 0 for a pilot episode (`tvShow`). */
  episodeNumber?: number

  /** The season number the episode belongs to. May be 0 for a pilot episode (`tvShow`). */
  seasonNumber?: number

  /** The name of the TV show (`tvShow`). */
  seriesTitle?: string

  /**
   * Arbitrary application-defined metadata fields. Used for `user` metadata, and may
   * also carry custom keys alongside the standard fields above for any type.
   */
  customData?: AnyMap
}

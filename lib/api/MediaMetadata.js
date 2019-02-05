// @flow

/**
 * Container for media metadata. Metadata has a media type, an optional list of images, and a collection of metadata fields.
 *
 * You will typically want to use one of the subtypes, based on the type of media.
 *
 * @class MediaMetadata
 * @property {WebImage[]} images
 * @property {string} metadataType=User One of `Generic`, `Movie`, `MusicTrack`, `Photo`, `TvShow`, `User`
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaMetadata}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_metadata}
 */
export default class MediaMetadata {
  metadataType = 'User'

  constructor(metadata) {
    Object.assign(this, metadata)
  }
}

/**
 * Metadata representing generic media content.
 *
 * @memberof MediaMetadata
 * @class Generic
 * @property {string} metadataType=Generic
 * @property {?string} artist The name of the artist who created the media.
 * @property {?string} releaseDate The date and/or time at which the media item was released, in ISO-8601 format.
 * @property {?string} subtitle The subtitle of the media.
 * @property {?string} title The title of the media.
 *
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.GenericMediaMetadata}
 */
class Generic extends MediaMetadata {
  metadataType = 'Generic'

  constructor(metadata) {
    super(metadata)
  }
}

/**
 * Media metadata representing a movie.
 *
 * @memberof MediaMetadata
 * @class Movie
 * @property {string} metadataType=Movie
 * @property {?string} releaseDate The date and/or time at which the movie was released, in ISO-8601 format.
 * @property {?string} studio The name of the movie studio that produced the movie.
 * @property {?string} subtitle The subtitle of the movie.
 * @property {?string} title The title of the movie.
 *
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MovieMediaMetadata}
 */
class Movie extends MediaMetadata {
  metadataType = 'Movie'

  constructor(metadata) {
    super(metadata)
  }
}

/**
 * Media metadata representing a music track.
 *
 * @memberof MediaMetadata
 * @class MusicTrack
 * @property {string} metadataType=MusicTrack
 * @property {?string} albumArtist The name of the artist who produced an album. For example, in compilation albums such as DJ mixes, the album artist is not necessarily the same as the artist(s) of the individual songs on the album.
 * @property {?string} albumTitle The title of the album that the music track belongs to.
 * @property {?string} artist The name of the artist who created the track.
 * @property {?string} composer The name of the composer of the music track.
 * @property {?number} discNumber The disc number (counting from 1) that the music track belongs to in a multi-disc album.
 * @property {?string} releaseDate The date and/or time at which the music track was released, in ISO-8601 format.
 * @property {?string} title The title of the music track.
 * @property {?number} trackNumber The track number of the music track on an album disc. Typically track numbers are counted starting from 1, however this value may be 0 if it is a "hidden track" at the beginning of an album.
 *
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MusicTrackMediaMetadata}
 */
class MusicTrack extends MediaMetadata {
  metadataType = 'MusicTrack'

  constructor(metadata) {
    super(metadata)
  }
}

/**
 * Media metadata representing a photo.
 *
 * @memberof MediaMetadata
 * @class Photo
 * @property {string} metadataType=Photo
 * @property {?string} artist The name of the photographer.
 * @property {?string} creationDate The date and/or time at which the photo was taken, in ISO-8601 format.
 * @property {?number} height Photo height, in pixels.
 * @property {?number} latitude The latitude component of the geographical location where the photograph was taken.
 * @property {?string} location Location where the photo was taken. For example, "Seattle, Washington, USA".
 * @property {?number} longitude The longitude component of the geographical location where the photograph was taken.
 * @property {?string} title The title of the photo.
 * @property {?number} width Photo width, in pixels.
 *
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.PhotoMediaMetadata}
 */
class Photo extends MediaMetadata {
  metadataType = 'Photo'

  constructor(metadata) {
    super(metadata)
  }
}

/**
 * Media metadata representing a TV show episode.
 *
 * @memberof MediaMetadata
 * @class TvShow
 * @property {string} metadataType=TvShow
 * @property {?string} broadcastDate The value is the date and/or time at which the TV show episode was first aired, in ISO-8601 format.
 * @property {?string} releaseDate The value is the date and/or time at which the TV show episode was released, in ISO-8601 format.
 * @property {?number} seasonNumber The season number that a TV show episode belongs to. Typically season numbers are counted starting from 1, however this value may be 0 if it is a "pilot" episode that predates the official start of a TV series.
 * @property {?string} seriesTitle The name of the TV show.
 * @property {?string} title The title of the episode.
 *
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.TvShowMediaMetadata}
 */
class TvShow extends MediaMetadata {
  metadataType = 'TvShow'

  constructor(metadata) {
    super(metadata)
  }
}

export { Generic, Movie, MusicTrack, Photo, TvShow }

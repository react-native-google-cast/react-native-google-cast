import WebImage from './WebImage';
/**
 * Container for media metadata. Metadata has a media type, an optional list of images, and a collection of metadata fields.
 *
 * You will typically want to use one of the subtypes, based on the type of media.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaMetadata) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaMetadata)
 */
export default interface MediaMetadata {
    /** List of images, e.g. a poster image, album cover, photo etc. */
    images?: WebImage[];
    /** Media type. */
    type: 'generic' | 'movie' | 'musicTrack' | 'photo' | 'tvShow' | 'user';
}
/**
 * Metadata representing generic media content.
 *
 * @example
 * ```ts
 * {
 *   type: 'generic',
 *   title: 'Mona Lisa',
 *   artist: 'Leonardo da Vinci'
 * }
 * ```
 */
export interface Generic extends MediaMetadata {
    /** The name of the artist who created the media. */
    artist?: string;
    /** Media type. */
    type: 'generic';
    /** The date and/or time at which the movie was released, in ISO-8601 format, e.g. '2008-04-10' or '2018-04-10T12:40:00'. */
    releaseDate?: string;
    /** The subtitle of the movie. */
    subtitle?: string;
    /** The title of the movie. */
    title?: string;
}
/**
 * Media metadata representing a movie.
 *
 * @example
 * ```ts
 * {
 *   type: 'movie',
 *   title: 'Avengers: Endgame',
 *   studio: 'Marvel Studios'
 * }
 * ```
 */
export interface Movie extends MediaMetadata {
    /** Media type. */
    type: 'movie';
    /** The date and/or time at which the movie was released, in ISO-8601 format, e.g. '2008-04-10' or '2018-04-10T12:40:00'. */
    releaseDate?: string;
    /** The name of the movie studio that produced the movie. */
    studio?: string;
    /** The subtitle of the movie. */
    subtitle?: string;
    /** The title of the movie. */
    title?: string;
}
/**
 * Media metadata representing a music track.
 *
 * @example
 * ```ts
 * {
 *   type: 'musicTrack',
 *   title: 'Photograph',
 *   artist: 'Ed Sheeran'
 * }
 * ```
 */
export interface MusicTrack extends MediaMetadata {
    /** The name of the artist who produced an album. For example, in compilation albums such as DJ mixes, the album artist is not necessarily the same as the artist(s) of the individual songs on the album. */
    albumArtist?: string;
    /** The title of the album that the music track belongs to. */
    albumTitle?: string;
    /** The name of the artist who created the track. */
    artist?: string;
    /** The name of the composer of the music track. */
    composer?: string;
    /** The disc number (counting from 1) that the music track belongs to in a multi-disc album. */
    discNumber?: number;
    /** Media type. */
    type: 'musicTrack';
    /** The date and/or time at which the music track was released, in ISO-8601 format. */
    releaseDate?: string;
    /** The title of the music track. */
    title?: string;
    /** The track number of the music track on an album disc. Typically track numbers are counted starting from 1, however this value may be 0 if it is a "hidden track" at the beginning of an album. */
    trackNumber?: number;
}
/**
 * Media metadata representing a photo.
 *
 * @example
 * ```ts
 * {
 *   type: 'photo',
 *   title: 'Lunch Atop a Skyscraper',
 * }
 * ```
 */
export interface Photo extends MediaMetadata {
    /** The name of the photographer. */
    artist?: string;
    /** The date and/or time at which the photo was taken, in ISO-8601 format. */
    creationDate?: string;
    /** Photo height, in pixels. */
    height?: number;
    /** The latitude component of the geographical location where the photograph was taken. */
    latitude?: number;
    /** Location where the photo was taken. For example, "Seattle, Washington, USA". */
    location?: string;
    /** The longitude component of the geographical location where the photograph was taken. */
    longitude?: number;
    /** Media type. */
    type: 'photo';
    /** The title of the photo. */
    title?: string;
    /** Photo width, in pixels. */
    width?: number;
}
/**
 * Media metadata representing a TV show episode.
 *
 * @example
 * ```ts
 * {
 *   type: 'tvShow',
 *   broadcastDate: '2018-03-29',
 *   episodeNumber: 18,
 *   seasonNumber: 11,
 *   seriesTitle: 'The Big Bang Theory',
 *   title: 'The Gates Excitation',
 * }
 * ```
 */
export interface TvShow extends MediaMetadata {
    /** The value is the date and/or time at which the TV show episode was first aired, in ISO-8601 format. */
    broadcastDate?: string;
    /** The number of an episode in a given season of a TV show. Typically episode numbers are counted starting from 1, however this value may be 0 if it is a "pilot" episode that is not considered to be an official episode of the first season. */
    episodeNumber?: number;
    /** Media type. */
    type: 'tvShow';
    /** The value is the date and/or time at which the TV show episode was released, in ISO-8601 format. */
    releaseDate?: string;
    /** The season number that a TV show episode belongs to. Typically season numbers are counted starting from 1, however this value may be 0 if it is a "pilot" episode that predates the official start of a TV series. */
    seasonNumber?: number;
    /** The name of the TV show. */
    seriesTitle?: string;
    /** The title of the episode. */
    title?: string;
}
/**
 * Custom media metadata.
 *
 * @example
 * ```ts
 * {
 *   type: 'user',
 *   mykey: 'My Value',
 * }
 * ```
 */
export interface User extends MediaMetadata {
    /** Media type. */
    type: 'user';
    [key: string]: any;
}

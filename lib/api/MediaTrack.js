/**
 * A type that represents a media track, such as a language track or closed caption text track in a video.
 *
 * @export
 * @typedef MediaTrack
 * @property {?string} contentId The content ID of the media track.
 * @property {number} id The unique ID of the media track.
 * @property {?string} contentType The content type (MIME type) of the media track, or null if none was specified.
 * @property {string} type The type of the track. One of `Audio`, `Text`, `Video`.
 * @property {string} subtype The text track's subtype; applies only to text tracks. One of `Captions`, `Chapters`, `Descriptions`, `Metadata`, `Subtitles`.
 * @property {?string} name The name of the media track, or null if none was specified.
 * @property {?string} languageCode The language of this media track in RFC-5464 format, or null if none was specified.
 * @property {?Object} customData The custom data object for this media track, or null if none was specified.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaTrack}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_track}
 */
export default class MediaTrack {}

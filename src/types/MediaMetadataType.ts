/**
 * The type of a {@linkcode MediaMetadata}.
 *
 * Acts as the discriminant for the flattened metadata struct: it selects which
 * of the optional metadata fields are meaningful for a given item.
 *
 * @see {@linkcode MediaMetadata.type}
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaMetadata#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.MetadataType)
 */
export type MediaMetadataType =
  /** Generic media content. */
  | 'generic'
  /** A movie. */
  | 'movie'
  /** A music track. */
  | 'musicTrack'
  /** A photo. */
  | 'photo'
  /** A TV show episode. */
  | 'tvShow'
  /** Custom, application-defined metadata stored under {@linkcode MediaMetadata.customData}. */
  | 'user'

/**
 * A type that aggregates information about a media item.
 *
 * Used by {@link RemoteMediaClient#loadMedia} to load media on the receiver application.
 *
 * @class MediaInfo
 * @param {Object} info
 * @param {string} info.contentId The URL of the content to be played.
 * @param {string} info.streamType The stream type. One of `Buffered`, `Live`, `None`.
 * @param {string} info.contentType The content (MIME) type.
 * @param {MediaMetadata} info.metadata The media item metadata.
 * @param {AdBreakInfo[]} info.adBreaks The list of ad breaks in this content.
 * @param {AdBreakClipInfo[]} info.adBreakClips The list of ad break clips in this content.
 * @param {number} info.streamDuration The length of the stream, in seconds, or `Infinity` if it is a live stream.
 * @param {MediaTrack[]} info.mediaTracks The media tracks for this stream.
 * @param {?TextTrackStyle}info. textTrackStyle The text track style for this stream.
 * @param {string} info.entity The deep link for the media as used by Google Assistant, if any.
 * @param {VastAdsRequest} info.VMAP The VMAP request configuration if any.
 * @param {?Object} info.customData The custom data, if any
 *
 * @property {string} contentId The URL of the content to be played.
 * @property {string} streamType The stream type. One of `Buffered`, `Live`, `None`.
 * @property {string} contentType The content (MIME) type.
 * @property {MediaMetadata} metadata The media item metadata.
 * @property {AdBreakInfo[]} adBreaks The list of ad breaks in this content.
 * @property {AdBreakClipInfo[]} adBreakClips The list of ad break clips in this content.
 * @property {number} streamDuration The length of the stream, in seconds, or `Infinity` if it is a live stream.
 * @property {MediaTrack[]} mediaTracks The media tracks for this stream.
 * @property {?TextTrackStyle} textTrackStyle The text track style for this stream.
 * @property {string} entity The deep link for the media as used by Google Assistant, if any.
 * @property {VastAdsRequest} VMAP The VMAP request configuration if any.
 * @property {?Object} customData The custom data, if any
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_information}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.MediaInfo}
 */
export default function MediaInfo(info) {
  Object.assign(this, info)
}

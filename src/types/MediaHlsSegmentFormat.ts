/**
 * The format of the HLS audio segment.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_information) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.HlsSegmentFormat)
 */
export type MediaHlsSegmentFormat =
  /** AAC packed audio elementary stream. */
  | 'AAC'
  /** AC3 packed audio elementary stream. */
  | 'AC3'
  /** E-AC3 packed audio elementary stream. */
  | 'E-AC3'
  /** Audio packed in ISO BMFF CMAF Fragmented MP4. */
  | 'FMP4'
  /** MP3 packed audio elementary stream. */
  | 'MP3'
  /** MPEG-2 transport stream. */
  | 'TS'
  /** AAC packed MPEG-2 transport stream. */
  | 'TS_AAC'

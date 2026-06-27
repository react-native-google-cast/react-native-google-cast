/**
 * The format of the HLS video segment.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaInfo#constant-summary) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_media_information) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.HlsVideoSegmentFormat)
 */
export type MediaHlsVideoSegmentFormat =
  /** Video packed in ISO BMFF CMAF Fragmented MP4. Supports AVC and HEVC. */
  | 'FMP4'
  /** MPEG-2 transport stream. Supports AVC. */
  | 'MPEG2-TS'

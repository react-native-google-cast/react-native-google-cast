enum MediaHlsVideoSegmentFormat {
  /** Video packed in ISO BMFF CMAF Fragmented MP4. Support AVC and HEVC. */
  FMP4 = 'fmp4',

  /** MPEG-2 transport stream. Support AVC. */
  MPEG2_TS = 'mpeg2_ts',
}

export default MediaHlsVideoSegmentFormat
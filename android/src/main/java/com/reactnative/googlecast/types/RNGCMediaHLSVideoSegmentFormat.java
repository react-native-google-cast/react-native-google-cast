package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.HlsVideoSegmentFormat;

public class RNGCMediaHlsVideoSegmentFormat {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
      case "fmp4":
        return HlsVideoSegmentFormat.FMP4;
      case "mpeg2_ts":
        return HlsVideoSegmentFormat.MPEG2_TS;
      default:
        return HlsVideoSegmentFormat.FMP4;
    }
  }

  public static @Nullable String toJson(final string value) {
    switch (value) {
      case HlsVideoSegmentFormat.FMP4:
        return "fmp4";
      case HlsVideoSegmentFormat.MPEG2_TS:
        return "mpeg2_ts";
      default:
        return null;
    }
  }
}

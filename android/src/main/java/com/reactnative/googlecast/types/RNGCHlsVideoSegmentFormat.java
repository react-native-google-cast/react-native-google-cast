package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.HlsVideoSegmentFormat;

public class RNGCHlsVideoSegmentFormat {
  public static String fromJson(final @Nullable String value) {
    switch (value) {
      case "FMP4":
        return HlsVideoSegmentFormat.FMP4;
      case "MPEG2-TS":
        return HlsVideoSegmentFormat.MPEG2_TS;
      default:
        return HlsVideoSegmentFormat.FMP4;
    }
  }

  public static @Nullable String toJson(final String value) {
    switch (value) {
      case HlsVideoSegmentFormat.FMP4:
        return "FMP4";
      case HlsVideoSegmentFormat.MPEG2_TS:
        return "MPEG2-TS";
      default:
        return null;
    }
  }
}

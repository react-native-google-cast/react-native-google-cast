package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.HlsVideoSegmentFormat;

public class RNGCHlsVideoSegmentFormat {
  public static @Nullable String fromJson(final @Nullable String value) {
    if (value == null) return null;

    switch (value) {
      case "FMP4":
        return HlsVideoSegmentFormat.FMP4;
      case "MPEG2-TS":
        return HlsVideoSegmentFormat.MPEG2_TS;
      default:
        return null;
    }
  }

  public static @Nullable String toJson(final @Nullable String value) {
    if (value == null) return null;

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

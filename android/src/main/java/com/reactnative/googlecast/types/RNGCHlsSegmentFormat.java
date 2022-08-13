package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.HlsSegmentFormat;

public class RNGCHlsSegmentFormat {
  public static @Nullable String fromJson(final @Nullable String value) {
    if (value == null) return null;

    switch (value) {
      case "AAC":
        return HlsSegmentFormat.AAC;
      case "AC3":
        return HlsSegmentFormat.AC3;
      case "E-AC3":
        return HlsSegmentFormat.E_AC3;
      case "FMP4":
        return HlsSegmentFormat.FMP4;
      case "MP3":
        return HlsSegmentFormat.MP3;
      case "TS":
        return HlsSegmentFormat.TS;
      case "TS_AAC":
        return HlsSegmentFormat.TS_AAC;
      default:
        return null;
    }
  }

  public static @Nullable String toJson(@Nullable final String value) {
    if (value == null) return null;

    switch (value) {
      case HlsSegmentFormat.AAC:
        return "AAC";
      case HlsSegmentFormat.AC3:
        return "AC3";
      case HlsSegmentFormat.E_AC3:
        return "E-AC3";
      case HlsSegmentFormat.FMP4:
        return "FMP4";
      case HlsSegmentFormat.MP3:
        return "MP3";
      case HlsSegmentFormat.TS:
        return "TS";
      case HlsSegmentFormat.TS_AAC:
        return "TS_AAC";
      default:
        return null;
    }
  }
}

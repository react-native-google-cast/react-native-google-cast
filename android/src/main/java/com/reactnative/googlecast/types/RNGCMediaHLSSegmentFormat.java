package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.HlsSegmentFormat;

public class RNGCMediaHlsSegmentFormat {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
      case "aac":
        return HlsSegmentFormat.AAC;
      case "ac3":
        return HlsSegmentFormat.AC3;
      case "e-ac3":
        return HlsSegmentFormat.E_AC3;
      case "fmp4":
        return HlsSegmentFormat.FMP4;
      case "mp3":
        return HlsSegmentFormat.MP3;
      case "ts":
        return HlsSegmentFormat.TS;
      case "ts_aac":
        return HlsSegmentFormat.TS_AAC;
      default:
        return HlsSegmentFormat.AAC;
    }
  }

  public static @Nullable String toJson(final string value) {
    switch (value) {
      case HlsSegmentFormat.AAC:
        return "aac";
      case HlsSegmentFormat.AC3:
        return "ac3";
      case HlsSegmentFormat.E_AC3:
        return "e-ac3";
      case HlsSegmentFormat.FMP4:
        return "fmp4";
      case HlsSegmentFormat.MP3:
        return "mp3";
      case HlsSegmentFormat.TS:
        return "ts";
      case HlsSegmentFormat.TS_AAC:
        return "ts_aac";
      default:
        return null;
    }
  }
}

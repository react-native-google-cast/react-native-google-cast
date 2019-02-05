package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaTrack;

public class RNGCMediaTextTrackSubtype {
  public static int fromJson(final String value) {
    switch (value) {
    case "Captions":
      return MediaTrack.SUBTYPE_CAPTIONS;
    case "Chapters":
      return MediaTrack.SUBTYPE_CHAPTERS;
    case "Descriptions":
      return MediaTrack.SUBTYPE_DESCRIPTIONS;
    case "Metadata":
      return MediaTrack.SUBTYPE_METADATA;
    case "Subtitles":
      return MediaTrack.SUBTYPE_SUBTITLES;
    default:
      return MediaTrack.SUBTYPE_UNKNOWN;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaTrack.SUBTYPE_CAPTIONS:
      return "Captions";
    case MediaTrack.SUBTYPE_CHAPTERS:
      return "Chapters";
    case MediaTrack.SUBTYPE_DESCRIPTIONS:
      return "Descriptions";
    case MediaTrack.SUBTYPE_METADATA:
      return "Metadata";
    case MediaTrack.SUBTYPE_SUBTITLES:
      return "Subtitles";
    default:
      return null;
    }
  }
}

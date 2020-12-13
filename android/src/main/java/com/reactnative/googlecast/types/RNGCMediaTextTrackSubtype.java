package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaTrack;

public class RNGCMediaTextTrackSubtype {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "captions":
      return MediaTrack.SUBTYPE_CAPTIONS;
    case "chapters":
      return MediaTrack.SUBTYPE_CHAPTERS;
    case "descriptions":
      return MediaTrack.SUBTYPE_DESCRIPTIONS;
    case "metadata":
      return MediaTrack.SUBTYPE_METADATA;
    case "subtitles":
      return MediaTrack.SUBTYPE_SUBTITLES;
    default:
      return MediaTrack.SUBTYPE_UNKNOWN;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case MediaTrack.SUBTYPE_CAPTIONS:
      return "captions";
    case MediaTrack.SUBTYPE_CHAPTERS:
      return "chapters";
    case MediaTrack.SUBTYPE_DESCRIPTIONS:
      return "descriptions";
    case MediaTrack.SUBTYPE_METADATA:
      return "metadata";
    case MediaTrack.SUBTYPE_SUBTITLES:
      return "subtitles";
    default:
      return null;
    }
  }
}

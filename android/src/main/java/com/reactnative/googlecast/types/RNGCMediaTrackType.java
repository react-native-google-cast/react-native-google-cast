package com.reactnative.googlecast.types;

import com.google.android.gms.cast.MediaTrack;

public class RNGCMediaTrackType {
  public static int fromJson(final String value) {
    switch (value) {
    case "audio":
      return MediaTrack.TYPE_AUDIO;
    case "text":
      return MediaTrack.TYPE_TEXT;
    case "video":
      return MediaTrack.TYPE_VIDEO;
    default:
      return MediaTrack.TYPE_UNKNOWN;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaTrack.TYPE_AUDIO:
      return "audio";
    case MediaTrack.TYPE_TEXT:
      return "text";
    case MediaTrack.TYPE_VIDEO:
      return "video";
    default:
      return null;
    }
  }
}

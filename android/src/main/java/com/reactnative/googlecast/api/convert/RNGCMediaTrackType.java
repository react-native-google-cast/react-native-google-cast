package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaTrack;

public class RNGCMediaTrackType {
  public static int fromJson(final String value) {
    switch (value) {
    case "Audio":
      return MediaTrack.TYPE_AUDIO;
    case "Text":
      return MediaTrack.TYPE_TEXT;
    case "Video":
      return MediaTrack.TYPE_VIDEO;
    default:
      return MediaTrack.TYPE_UNKNOWN;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaTrack.TYPE_AUDIO:
      return "Audio";
    case MediaTrack.TYPE_TEXT:
      return "Text";
    case MediaTrack.TYPE_VIDEO:
      return "Video";
    default:
      return null;
    }
  }
}

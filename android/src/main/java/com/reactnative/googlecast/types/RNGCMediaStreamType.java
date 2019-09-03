package com.reactnative.googlecast.types;

import com.google.android.gms.cast.MediaInfo;

public class RNGCMediaStreamType {
  public static int fromJson(final String value) {
    switch (value) {
    case "buffered":
      return MediaInfo.STREAM_TYPE_BUFFERED;
    case "live":
      return MediaInfo.STREAM_TYPE_LIVE;
    case "none":
      return MediaInfo.STREAM_TYPE_NONE;
    default:
      return MediaInfo.STREAM_TYPE_INVALID;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaInfo.STREAM_TYPE_BUFFERED:
      return "buffered";
    case MediaInfo.STREAM_TYPE_LIVE:
      return "live";
    case MediaInfo.STREAM_TYPE_NONE:
      return "none";
    default:
      return null;
    }
  }
}

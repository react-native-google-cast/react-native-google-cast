package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaInfo;

public class RNGCMediaStreamType {
  public static int fromJson(final String value) {
    switch (value) {
    case "Buffered":
      return MediaInfo.STREAM_TYPE_BUFFERED;
    case "Live":
      return MediaInfo.STREAM_TYPE_LIVE;
    case "None":
      return MediaInfo.STREAM_TYPE_NONE;
    default:
      return MediaInfo.STREAM_TYPE_INVALID;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaInfo.STREAM_TYPE_BUFFERED:
      return "Buffered";
    case MediaInfo.STREAM_TYPE_LIVE:
      return "Live";
    case MediaInfo.STREAM_TYPE_NONE:
      return "None";
    default:
      return null;
    }
  }
}

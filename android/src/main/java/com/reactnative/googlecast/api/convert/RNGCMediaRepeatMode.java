package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaStatus;

public class RNGCMediaRepeatMode {
  public static int fromJson(final String value) {
    switch (value) {
    case "All":
      return MediaStatus.REPEAT_MODE_REPEAT_ALL;
    case "AllAndShuffle":
      return MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE;
    case "Off":
      return MediaStatus.REPEAT_MODE_REPEAT_OFF;
    case "Single":
      return MediaStatus.REPEAT_MODE_REPEAT_SINGLE;
    default:
      return MediaStatus.REPEAT_MODE_REPEAT_OFF;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaStatus.REPEAT_MODE_REPEAT_ALL:
      return "All";
    case MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE:
      return "AllAndShuffle";
    case MediaStatus.REPEAT_MODE_REPEAT_OFF:
      return "Off";
    case MediaStatus.REPEAT_MODE_REPEAT_SINGLE:
      return "Single";
    default:
      return null;
    }
  }
}

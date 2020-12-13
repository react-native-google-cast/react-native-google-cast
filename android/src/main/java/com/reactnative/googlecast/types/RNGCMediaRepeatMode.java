package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaStatus;

public class RNGCMediaRepeatMode {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "all":
      return MediaStatus.REPEAT_MODE_REPEAT_ALL;
    case "allAndShuffle":
      return MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE;
    case "off":
      return MediaStatus.REPEAT_MODE_REPEAT_OFF;
    case "single":
      return MediaStatus.REPEAT_MODE_REPEAT_SINGLE;
    default:
      return MediaStatus.REPEAT_MODE_REPEAT_OFF;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case MediaStatus.REPEAT_MODE_REPEAT_ALL:
      return "all";
    case MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE:
      return "allAndShuffle";
    case MediaStatus.REPEAT_MODE_REPEAT_OFF:
      return "off";
    case MediaStatus.REPEAT_MODE_REPEAT_SINGLE:
      return "single";
    default:
      return null;
    }
  }
}

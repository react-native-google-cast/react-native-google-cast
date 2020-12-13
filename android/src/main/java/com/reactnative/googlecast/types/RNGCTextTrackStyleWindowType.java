package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.TextTrackStyle;

public class RNGCTextTrackStyleWindowType {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "none":
      return TextTrackStyle.WINDOW_TYPE_NONE;
    case "normal":
      return TextTrackStyle.WINDOW_TYPE_NORMAL;
    case "rounded":
      return TextTrackStyle.WINDOW_TYPE_ROUNDED;
    default:
      return TextTrackStyle.WINDOW_TYPE_UNSPECIFIED;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case TextTrackStyle.WINDOW_TYPE_NONE:
      return "none";
    case TextTrackStyle.WINDOW_TYPE_NORMAL:
      return "normal";
    case TextTrackStyle.WINDOW_TYPE_ROUNDED:
      return "rounded";
    default:
      return null;
    }
  }
}

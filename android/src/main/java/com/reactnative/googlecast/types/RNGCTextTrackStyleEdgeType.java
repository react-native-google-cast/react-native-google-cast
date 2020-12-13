package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.TextTrackStyle;

public class RNGCTextTrackStyleEdgeType {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "depressed":
      return TextTrackStyle.EDGE_TYPE_DEPRESSED;
    case "dropShadow":
      return TextTrackStyle.EDGE_TYPE_DROP_SHADOW;
    case "none":
      return TextTrackStyle.EDGE_TYPE_NONE;
    case "outline":
      return TextTrackStyle.EDGE_TYPE_OUTLINE;
    case "raised":
      return TextTrackStyle.EDGE_TYPE_RAISED;
    default:
      return TextTrackStyle.EDGE_TYPE_UNSPECIFIED;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case TextTrackStyle.EDGE_TYPE_DEPRESSED:
      return "depressed";
    case TextTrackStyle.EDGE_TYPE_DROP_SHADOW:
      return "dropShadow";
    case TextTrackStyle.EDGE_TYPE_NONE:
      return "none";
    case TextTrackStyle.EDGE_TYPE_OUTLINE:
      return "outline";
    case TextTrackStyle.EDGE_TYPE_RAISED:
      return "raised";
    default:
      return null;
    }
  }
}

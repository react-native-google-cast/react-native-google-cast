package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.TextTrackStyle;

public class RNGCTextTrackStyleFontGenericFamily {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "casual":
      return TextTrackStyle.FONT_FAMILY_CASUAL;
    case "cursive":
      return TextTrackStyle.FONT_FAMILY_CURSIVE;
    case "monoSansSerif":
      return TextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF;
    case "monoSerif":
      return TextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF;
    case "sansSerif":
      return TextTrackStyle.FONT_FAMILY_SANS_SERIF;
    case "serif":
      return TextTrackStyle.FONT_FAMILY_SERIF;
    case "smallCaps":
      return TextTrackStyle.FONT_FAMILY_SMALL_CAPITALS;
    default:
      return TextTrackStyle.FONT_STYLE_UNSPECIFIED;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case TextTrackStyle.FONT_FAMILY_CASUAL:
      return "casual";
    case TextTrackStyle.FONT_FAMILY_CURSIVE:
      return "cursive";
    case TextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF:
      return "monoSansSerif";
    case TextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF:
      return "monoSerif";
    case TextTrackStyle.FONT_FAMILY_SANS_SERIF:
      return "sansSerif";
    case TextTrackStyle.FONT_FAMILY_SERIF:
      return "serif";
    case TextTrackStyle.FONT_FAMILY_SMALL_CAPITALS:
      return "smallCaps";
    default:
      return null;
    }
  }
}

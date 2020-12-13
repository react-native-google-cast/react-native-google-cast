package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.TextTrackStyle;

public class RNGCTextTrackStyleFontStyle {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "bold":
      return TextTrackStyle.FONT_STYLE_BOLD;
    case "boldItalic":
      return TextTrackStyle.FONT_STYLE_BOLD_ITALIC;
    case "italic":
      return TextTrackStyle.FONT_STYLE_ITALIC;
    case "normal":
      return TextTrackStyle.FONT_STYLE_NORMAL;
    default:
      return TextTrackStyle.FONT_STYLE_UNSPECIFIED;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case TextTrackStyle.FONT_STYLE_BOLD:
      return "bold";
    case TextTrackStyle.FONT_STYLE_BOLD_ITALIC:
      return "boldItalic";
    case TextTrackStyle.FONT_STYLE_ITALIC:
      return "italic";
    case TextTrackStyle.FONT_STYLE_NORMAL:
      return "normal";
    default:
      return null;
    }
  }
}

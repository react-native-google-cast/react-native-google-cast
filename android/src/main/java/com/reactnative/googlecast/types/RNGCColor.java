package com.reactnative.googlecast.types;

import android.graphics.Color;

import androidx.annotation.Nullable;

public class RNGCColor {
  public static int fromJson(final @Nullable String color) {
    if (color == null) return 0; // COLOR_UNSPECIFIED

    try {
      if (color.startsWith("#")) {
        // Android's Color starts with alpha, e.g. "#AARRGGBB"
        String rgb = color.substring(1, 7);
        String a = color.substring(7);
        return Color.parseColor("#" + a + rgb);
      } else {
        // try parsing color by name
        return Color.parseColor(color);
      }
    } catch (IllegalArgumentException e) {
      return 0;
    }
  }

  public static @Nullable String toJson(final int color) {
    if (color == 0) return null; // COLOR_UNSPECIFIED

    String argb = String.format("%08X", color);
    String a = argb.substring(0, 2);
    String rgb = argb.substring(2);
    return "#" + rgb + a;
  }
}

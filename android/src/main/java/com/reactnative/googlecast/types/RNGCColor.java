package com.reactnative.googlecast.types;

import android.graphics.Color;

import androidx.annotation.NonNull;

public class RNGCColor {
  public static int fromJson(final @NonNull String color) {
    String rgb = color.substring(1, 7);
    String a = color.substring(7);
    return Color.parseColor("#" + a + rgb);
  }

  public static @NonNull String toJson(final int color) {
    String argb = Integer.toHexString(color);
    String a = argb.substring(0, 2);
    String rgb = argb.substring(2);
    return "#" + rgb + a;
  }
}

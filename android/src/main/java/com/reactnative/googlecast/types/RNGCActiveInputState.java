package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.Cast;

public class RNGCActiveInputState {
  public static @Nullable String toJson(final int value) {
    switch (value) {
    case Cast.ACTIVE_INPUT_STATE_YES:
      return "active";
    case Cast.ACTIVE_INPUT_STATE_NO:
      return "inactive";
    case Cast.ACTIVE_INPUT_STATE_UNKNOWN:
      return "unknown";
    default:
      return null;
    }
  }
}

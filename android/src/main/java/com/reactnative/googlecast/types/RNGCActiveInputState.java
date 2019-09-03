package com.reactnative.googlecast.types;

import com.google.android.gms.cast.Cast;

public class RNGCActiveInputState {
  public static String toJson(final int value) {
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

package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.Cast;

public class RNGCStandbyState {
  public static @Nullable String toJson(final int value) {
    switch (value) {
    case Cast.STANDBY_STATE_YES:
      return "Active";
    case Cast.STANDBY_STATE_NO:
      return "Inactive";
    case Cast.STANDBY_STATE_UNKNOWN:
      return "Unknown";
    default:
      return null;
    }
  }
}

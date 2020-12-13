package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.framework.CastState;

public class RNGCCastState {
  public static @Nullable String toJson(final int value) {
    switch (value) {
    case CastState.CONNECTED:
      return "connected";
    case CastState.CONNECTING:
      return "connecting";
    case CastState.NOT_CONNECTED:
      return "notConnected";
    case CastState.NO_DEVICES_AVAILABLE:
      return "noDevicesAvailable";
    default:
      return null;
    }
  }
}

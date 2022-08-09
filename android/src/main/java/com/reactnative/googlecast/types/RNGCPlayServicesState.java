package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.common.ConnectionResult;

public class RNGCPlayServicesState {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
      case "success":
        return ConnectionResult.SUCCESS;
      case "missing":
        return ConnectionResult.SERVICE_MISSING;
      case "updating":
        return ConnectionResult.SERVICE_UPDATING;
      case "updateRequired":
        return ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED;
      case "disabled":
        return ConnectionResult.SERVICE_DISABLED;
      case "invalid":
        return ConnectionResult.SERVICE_INVALID;
      default:
        return ConnectionResult.UNKNOWN;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case ConnectionResult.SUCCESS:
      return "success";
    case ConnectionResult.SERVICE_MISSING:
      return "missing";
    case ConnectionResult.SERVICE_UPDATING:
      return "updating";
    case ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED:
      return "updateRequired";
    case ConnectionResult.SERVICE_DISABLED:
      return "disabled";
    case ConnectionResult.SERVICE_INVALID:
      return "invalid";
    default:
      return null;
    }
  }
}

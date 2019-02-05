package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaStatus;

public class RNGCMediaPlayerIdleReason {
  public static int fromJson(final String value) {
    switch (value) {
    case "Cancelled":
      return MediaStatus.IDLE_REASON_CANCELED;
    case "Error":
      return MediaStatus.IDLE_REASON_ERROR;
    case "Finished":
      return MediaStatus.IDLE_REASON_FINISHED;
    case "Interrupted":
      return MediaStatus.IDLE_REASON_INTERRUPTED;
    default:
      return MediaStatus.IDLE_REASON_NONE;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaStatus.IDLE_REASON_CANCELED:
      return "Cancelled";
    case MediaStatus.IDLE_REASON_ERROR:
      return "Error";
    case MediaStatus.IDLE_REASON_FINISHED:
      return "Finished";
    case MediaStatus.IDLE_REASON_INTERRUPTED:
      return "Interrupted";
    default:
      return null;
    }
  }
}

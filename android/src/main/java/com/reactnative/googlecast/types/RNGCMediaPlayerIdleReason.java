package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaStatus;

public class RNGCMediaPlayerIdleReason {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "cancelled":
      return MediaStatus.IDLE_REASON_CANCELED;
    case "error":
      return MediaStatus.IDLE_REASON_ERROR;
    case "finished":
      return MediaStatus.IDLE_REASON_FINISHED;
    case "interrupted":
      return MediaStatus.IDLE_REASON_INTERRUPTED;
    default:
      return MediaStatus.IDLE_REASON_NONE;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case MediaStatus.IDLE_REASON_CANCELED:
      return "cancelled";
    case MediaStatus.IDLE_REASON_ERROR:
      return "error";
    case MediaStatus.IDLE_REASON_FINISHED:
      return "finished";
    case MediaStatus.IDLE_REASON_INTERRUPTED:
      return "interrupted";
    default:
      return null;
    }
  }
}

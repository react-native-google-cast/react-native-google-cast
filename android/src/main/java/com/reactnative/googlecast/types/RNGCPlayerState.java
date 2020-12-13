package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaStatus;

public class RNGCPlayerState {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "buffering":
      return MediaStatus.PLAYER_STATE_BUFFERING;
    case "idle":
      return MediaStatus.PLAYER_STATE_IDLE;
    case "paused":
      return MediaStatus.PLAYER_STATE_PAUSED;
    case "playing":
      return MediaStatus.PLAYER_STATE_PLAYING;
    case "loading":
    default:
      return MediaStatus.PLAYER_STATE_UNKNOWN;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case MediaStatus.PLAYER_STATE_BUFFERING:
      return "buffering";
    case MediaStatus.PLAYER_STATE_IDLE:
      return "idle";
    case MediaStatus.PLAYER_STATE_PAUSED:
      return "paused";
    case MediaStatus.PLAYER_STATE_PLAYING:
      return "playing";
    default:
      return null;
    }
  }
}

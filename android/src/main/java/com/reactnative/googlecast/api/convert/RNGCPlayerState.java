package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaStatus;

public class RNGCPlayerState {
  public static int fromJson(final String value) {
    switch (value) {
    case "Buffering":
      return MediaStatus.PLAYER_STATE_BUFFERING;
    case "Idle":
      return MediaStatus.PLAYER_STATE_IDLE;
    case "Paused":
      return MediaStatus.PLAYER_STATE_PAUSED;
    case "Playing":
      return MediaStatus.PLAYER_STATE_PLAYING;
    case "Loading":
    default:
      return MediaStatus.PLAYER_STATE_UNKNOWN;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaStatus.PLAYER_STATE_BUFFERING:
      return "Buffering";
    case MediaStatus.PLAYER_STATE_IDLE:
      return "Idle";
    case MediaStatus.PLAYER_STATE_PAUSED:
      return "Paused";
    case MediaStatus.PLAYER_STATE_PLAYING:
      return "Playing";
    default:
      return null;
    }
  }
}

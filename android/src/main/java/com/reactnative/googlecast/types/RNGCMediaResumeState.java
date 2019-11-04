package com.reactnative.googlecast.types;

import com.google.android.gms.cast.MediaSeekOptions;

public class RNGCMediaResumeState {
  public static int fromJson(final String value) {
    switch (value) {
    case "play":
      return MediaSeekOptions.RESUME_STATE_PLAY;
    case "pause":
      return MediaSeekOptions.RESUME_STATE_PAUSE;
    default:
      return MediaSeekOptions.RESUME_STATE_UNCHANGED;
    }
  }
}

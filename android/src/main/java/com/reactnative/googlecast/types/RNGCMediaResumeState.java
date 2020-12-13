package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaSeekOptions;

public class RNGCMediaResumeState {
  public static int fromJson(final @Nullable String value) {
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

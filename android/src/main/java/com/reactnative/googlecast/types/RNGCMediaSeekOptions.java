package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.cast.MediaSeekOptions;

public class RNGCMediaSeekOptions {
  public static @Nullable MediaSeekOptions fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    final MediaSeekOptions.Builder builder = new MediaSeekOptions.Builder();

    if (json.hasKey("customData")) {
      builder.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("infinite")) {
      builder.setIsSeekToInfinite(json.getBoolean("infinite"));
    }

    if (json.hasKey("position")) {
      builder.setPosition(Math.round(json.getDouble("position") * 1000));
    }

    if (json.hasKey("resumeState")) {
      builder.setResumeState(RNGCMediaResumeState.fromJson(json.getString("resumeState")));
    }

    return builder.build();
  }
}

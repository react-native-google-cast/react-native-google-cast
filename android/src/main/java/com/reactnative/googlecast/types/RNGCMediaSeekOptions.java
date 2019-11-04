package com.reactnative.googlecast.types;

import com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.cast.MediaSeekOptions;

public class RNGCMediaSeekOptions {
  public static MediaSeekOptions fromJson(final ReadableMap json) {
    final MediaSeekOptions.Builder builder = new MediaSeekOptions.Builder();

    if (json.hasKey("customData")) {
      builder.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("infinite")) {
      builder.setIsSeekToInfinite(json.getBoolean("infinite"));
    }

    if (json.hasKey("position")) {
      builder.setPosition(json.getInt("position"));
    }

    if (json.hasKey("resumeState")) {
      builder.setResumeState(RNGCMediaResumeState.fromJson(json.getString("resumeState")));
    }

    return builder.build();
  }
}

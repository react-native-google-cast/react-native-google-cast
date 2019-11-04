package com.reactnative.googlecast.types;

import com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.cast.MediaLoadOptions;

import org.json.JSONObject;

public class RNGCMediaLoadOptions {
  public static MediaLoadOptions fromJson(final ReadableMap json) {
    final MediaLoadOptions.Builder builder = new MediaLoadOptions.Builder();

    // if (json.hasKey("activeTrackIds")) {
    //   builder.setActiveTrackIds(json.getArray("activeTrackIds").toArrayList());
    // }

    if (json.hasKey("autoplay")) {
      builder.setAutoplay(json.getBoolean("autoplay"));
    }

    if (json.hasKey("credentials")) {
      builder.setCredentials(json.getString("credentials"));
    }

    if (json.hasKey("credentialsType")) {
      builder.setCredentialsType(json.getString("credentialsType"));
    }

    if (json.hasKey("customData")) {
      builder.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("playbackRate")) {
      builder.setPlaybackRate(json.getDouble("playbackRate"));
    }

    if (json.hasKey("playPosition")) {
      builder.setPlayPosition(json.getInt("playPosition"));
    }

    return builder.build();
  }
}

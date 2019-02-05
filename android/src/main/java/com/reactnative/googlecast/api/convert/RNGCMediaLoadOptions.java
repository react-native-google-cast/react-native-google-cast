package com.reactnative.googlecast.api.convert;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaInfo;
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
    if (json.hasKey("playPosition")) {
      builder.setPlayPosition(json.getInt("playPosition"));
    }
    if (json.hasKey("playbackRate")) {
      builder.setPlaybackRate(json.getDouble("playbackRate"));
    }
    if (json.hasKey("customData")) {
      builder.setCustomData(
          new JSONObject(json.getMap("customData").toHashMap()));
    }

    return builder.build();
  }
}

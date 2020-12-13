package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaTrack;

import org.json.JSONObject;

public class RNGCMediaTrack {
  public static @Nullable MediaTrack fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    int id = json.getInt("id");
    int type = RNGCMediaTrackType.fromJson(json.getString("type"));

    MediaTrack.Builder builder = new MediaTrack.Builder(id, type);

    if (json.hasKey("contentId")) {
      builder.setContentId(json.getString("contentId"));
    }

    if (json.hasKey("contentType")) {
      builder.setContentType(json.getString("contentType"));
    }

    if (json.hasKey("customData")) {
      builder.setCustomData(
          new JSONObject(json.getMap("customData").toHashMap()));
    }

    if (json.hasKey("language")) {
      builder.setLanguage(json.getString("language"));
    }

    if (json.hasKey("name")) {
      builder.setName(json.getString("name"));
    }

    if (json.hasKey("subtype")) {
      builder.setSubtype(
          RNGCMediaTextTrackSubtype.fromJson(json.getString("subtype")));
    }

    return builder.build();
  }

  public static @Nullable WritableMap toJson(final @Nullable MediaTrack track) {
    if (track == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putInt("id", (int) track.getId());

    json.putString("contentId", track.getContentId());

    json.putString("contentType", track.getContentType());

    json.putMap("customData", RNGCJSONObject.toJson(track.getCustomData()));

    json.putString("language", track.getLanguage());

    json.putString("name", track.getName());

    json.putString("type", RNGCMediaTrackType.toJson(track.getType()));

    json.putString("subtype", RNGCMediaTextTrackSubtype.toJson(track.getSubtype()));

    return json;
  }
}

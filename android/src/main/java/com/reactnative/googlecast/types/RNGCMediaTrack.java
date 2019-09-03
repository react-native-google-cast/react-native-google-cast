package com.reactnative.googlecast.types;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaTrack;

import org.json.JSONObject;

public class RNGCMediaTrack {
  public static MediaTrack fromJson(final ReadableMap json) {
    int type = RNGCMediaTrackType.fromJson(json.getString("type"));
    int id = json.getInt("id");

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
    if (json.hasKey("languageCode")) {
      builder.setLanguage(json.getString("languageCode"));
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

  public static WritableMap toJson(final MediaTrack track) {
    final WritableMap json = new WritableNativeMap();

    json.putInt("id", (int) track.getId());
    json.putString("contentId", track.getContentId());
    json.putString("contentType", track.getContentType());
    json.putMap("customData", RNGCJSONObject.toJson(track.getCustomData()));
    json.putString("languageCode", track.getLanguage());
    json.putString("name", track.getName());
    json.putString("type", RNGCMediaTrackType.toJson(track.getType()));
    json.putString("subtype", RNGCMediaTextTrackSubtype.toJson(track.getSubtype()));

    return json;
  }
}

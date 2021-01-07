package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.framework.media.MediaQueue;
import com.google.android.gms.common.images.WebImage;
import com.google.android.gms.common.util.ArrayUtils;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RNGCMediaQueueItem {
  public static MediaQueueItem fromJson(final ReadableMap json) {
    MediaQueueItem.Builder builder;

    if (json.hasKey("mediaInfo")) {
      builder = new MediaQueueItem.Builder((RNGCMediaInfo.fromJson(json.getMap("mediaInfo"))));
    } else {
      try {
        builder = new MediaQueueItem.Builder(new JSONObject());
      } catch (JSONException e) {
        // just to satisfy the compiler, this won't happen
        builder = new MediaQueueItem.Builder(RNGCMediaInfo.fromJson(json));
      }
    }

    if (json.hasKey("activeTrackIds")) {
      ReadableArray trackIdsArray = json.getArray("activeTrackIds");
      long[] activeTrackIds = new long[trackIdsArray.size()];
      for (int i = 0; i < trackIdsArray.size(); i++) {
        activeTrackIds[i] = trackIdsArray.getInt(i);
      }
      builder.setActiveTrackIds(activeTrackIds);
    }

    if (json.hasKey("autoplay")) {
      builder.setAutoplay(json.getBoolean("autoplay"));
    }

    if (json.hasKey("customData")) {
      builder.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("playbackDuration")) {
      builder.setPlaybackDuration(json.getDouble("playbackDuration"));
    }

    if (json.hasKey("preloadTime")) {
      builder.setPreloadTime(json.getDouble("preloadTime"));
    }

    if (json.hasKey("startTime")) {
      builder.setStartTime(json.getDouble("startTime"));
    }

    return builder.build();
  }

  public static @Nullable WritableMap toJson(final @Nullable MediaQueueItem item) {
    if (item == null) return null;

    final WritableMap json = new WritableNativeMap();

    final WritableArray activeTrackIds = Arguments.createArray();
    if (item.getActiveTrackIds() != null) {
      for (long activeTrackId: item.getActiveTrackIds()) {
        activeTrackIds.pushInt((int) activeTrackId);
      }
    }
    json.putArray("activeTrackIds", activeTrackIds);

    json.putBoolean("autoplay", item.getAutoplay());

    json.putMap("customData", RNGCJSONObject.toJson(item.getCustomData()));

    json.putInt("itemId", item.getItemId());

    json.putMap("mediaInfo", RNGCMediaInfo.toJson(item.getMedia()));

    if(!Double.isInfinite(item.getPlaybackDuration())) {
      json.putDouble("playbackDuration", item.getPlaybackDuration());
    }

    json.putDouble("preloadTime", item.getPreloadTime());

    if(!Double.isNaN(item.getStartTime())) {
      json.putDouble("startTime", item.getStartTime());
    }

    return json;
  }
}

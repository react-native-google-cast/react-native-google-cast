package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaQueueData;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class RNGCMediaQueueData {
  public static MediaQueueData fromJson(final ReadableMap json) {
    MediaQueueData.Builder builder = new MediaQueueData.Builder();

    if (json.hasKey("containerMetadata")) {
      builder.setContainerMetadata(RNGCMediaQueueContainerMetadata.fromJson(json.getMap("containerMetadata")));
    }

    if (json.hasKey("entity")) {
      builder.setEntity(json.getString("entity"));
    }

    if (json.hasKey("id")) {
      builder.setQueueId(json.getString("id"));
    }

    if (json.hasKey("items")) {
      final List<MediaQueueItem> items = new ArrayList<MediaQueueItem>();
      ReadableArray itemsArray = json.getArray("items");
      for (int i = 0; i < itemsArray.size(); i++) {
        items.add(RNGCMediaQueueItem.fromJson(itemsArray.getMap(i)));
      }
      builder.setItems(items);
    }

    if (json.hasKey("name")) {
      builder.setName(json.getString("name"));
    }

    if (json.hasKey("repeatMode")) {
      builder.setRepeatMode(RNGCMediaRepeatMode.fromJson(json.getString("repeatMode")));
    }

    if (json.hasKey("startIndex")) {
      builder.setStartIndex(json.getInt("startIndex"));
    }

    if (json.hasKey("startTime")) {
      builder.setStartTime(Math.round(json.getDouble("startTime") * 1000));
    }

    if (json.hasKey("type")) {
      builder.setQueueType(RNGCMediaQueueType.fromJson(json.getString("type")));
    }

    return builder.build();
  }

  public static @Nullable WritableMap toJson(final @Nullable MediaQueueData data) {
    if (data == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putMap("containerMetadata", RNGCMediaQueueContainerMetadata.toJson(data.getContainerMetadata()));

    json.putString("entity", data.getEntity());

    json.putString("id", data.getQueueId());

    final WritableArray items = Arguments.createArray();
    if (data.getItems() != null) {
      for (MediaQueueItem item : data.getItems()) {
        items.pushMap(RNGCMediaQueueItem.toJson(item));
      }
    }
    json.putArray("items", items);

    json.putString("name", data.getName());

    json.putString("repeatMode", RNGCMediaRepeatMode.toJson(data.getRepeatMode()));

    json.putString("type", RNGCMediaQueueType.toJson(data.getQueueType()));

    return json;
  }
}

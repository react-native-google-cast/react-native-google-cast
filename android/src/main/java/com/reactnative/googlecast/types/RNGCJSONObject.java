package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

public class RNGCJSONObject {
  public static @Nullable JSONObject fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;
    return new JSONObject(json.toHashMap());
  }

  public static @Nullable WritableMap toJson(@Nullable JSONObject jsonObject) {
    if (jsonObject == null) return null;

    WritableMap writableMap = Arguments.createMap();
    Iterator iterator = jsonObject.keys();

    while (iterator.hasNext()) {
      try {
        String key = (String) iterator.next();
        Object value = jsonObject.get(key);

        if (value instanceof Float || value instanceof Double) {
          writableMap.putDouble(key, jsonObject.getDouble(key));
        } else if (value instanceof Number) {
          writableMap.putInt(key, jsonObject.getInt(key));
        } else if (value instanceof String) {
          writableMap.putString(key, jsonObject.getString(key));
        } else if (value instanceof JSONObject) {
          writableMap.putMap(key, toJson(jsonObject.getJSONObject(key)));
        } else if (value instanceof JSONArray) {
          writableMap.putArray(key, toJson(jsonObject.getJSONArray(key)));
        } else if (value == JSONObject.NULL) {
          writableMap.putNull(key);
        }
      } catch (JSONException e) {
      }
    }

    return writableMap;
  }

  private static WritableArray toJson(JSONArray jsonArray) {
    WritableArray writableArray = Arguments.createArray();

    for (int i = 0; i < jsonArray.length(); i++) {
      try {
        Object value = jsonArray.get(i);

        if (value instanceof Float || value instanceof Double) {
          writableArray.pushDouble(jsonArray.getDouble(i));
        } else if (value instanceof Number) {
          writableArray.pushInt(jsonArray.getInt(i));
        } else if (value instanceof String) {
          writableArray.pushString(jsonArray.getString(i));
        } else if (value instanceof JSONObject) {
          writableArray.pushMap(toJson(jsonArray.getJSONObject(i)));
        } else if (value instanceof JSONArray) {
          writableArray.pushArray(toJson(jsonArray.getJSONArray(i)));
        } else if (value == JSONObject.NULL) {
          writableArray.pushNull();
        }
      } catch (JSONException e) {
      }
    }

    return writableArray;
  }
}

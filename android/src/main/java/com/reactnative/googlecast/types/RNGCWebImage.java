package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;

public class RNGCWebImage {
  public static @Nullable WebImage fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    return new WebImage(new JSONObject(json.toHashMap()));
  }

  public static @Nullable WritableMap toJson(final @Nullable WebImage image) {
    if (image == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putString("url", image.getUrl().toString());
    json.putInt("height", image.getHeight());
    json.putInt("width", image.getWidth());

    return json;
  }
}

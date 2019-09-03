package com.reactnative.googlecast.types;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;

public class RNGCWebImage {
  public static WebImage fromJson(final ReadableMap json) {
    return new WebImage(new JSONObject(json.toHashMap()));
  }

  public static WritableMap toJson(final WebImage image) {
    final WritableMap json = new WritableNativeMap();

    json.putString("url", image.getUrl().toString());
    json.putInt("height", image.getHeight());
    json.putInt("width", image.getWidth());

    return json;
  }
}

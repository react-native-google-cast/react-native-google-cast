package com.reactnative.googlecast.types;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.VideoInfo;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;

public class RNGCVideoInfo {
  public static WritableMap toJson(final VideoInfo video) {
    final WritableMap json = new WritableNativeMap();

    json.putString("hdrType", RNGCVideoInfoHDRType.toJson(video.getHdrType()));
    json.putInt("height", video.getHeight());
    json.putInt("width", video.getWidth());

    return json;
  }
}

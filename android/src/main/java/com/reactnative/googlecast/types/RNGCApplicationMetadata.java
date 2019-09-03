package com.reactnative.googlecast.types;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;

public class RNGCApplicationMetadata {
  public static WritableMap toJson(final ApplicationMetadata metadata) {
    final WritableMap json = new WritableNativeMap();

    json.putString("applicationId", metadata.getApplicationId());

    WritableArray images = Arguments.createArray();
    for (WebImage image: metadata.getImages()) {
      images.pushMap(RNGCWebImage.toJson(image));
    }
    json.putArray("images", images);

    json.putString("name", metadata.getName());

    WritableArray namespaces = Arguments.createArray();
    for (String namespace: metadata.getSupportedNamespaces()) {
      namespaces.pushString(namespace);
    }
    json.putArray("namespaces", namespaces);

    return json;
  }
}

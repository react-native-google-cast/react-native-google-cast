package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.common.images.WebImage;

public class RNGCApplicationMetadata {
  public static @Nullable
  WritableMap toJson(final @Nullable ApplicationMetadata metadata) {
    if (metadata == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putString("applicationId", metadata.getApplicationId());

    WritableArray images = Arguments.createArray();
    if (metadata.getImages() != null) {
      for (WebImage image : metadata.getImages()) {
        images.pushMap(RNGCWebImage.toJson(image));
      }
    }
    json.putArray("images", images);

    json.putString("name", metadata.getName());

    WritableArray namespaces = Arguments.createArray();
    if (metadata.getSupportedNamespaces() != null) {
      for (String namespace : metadata.getSupportedNamespaces()) {
        namespaces.pushString(namespace);
      }
    }
    json.putArray("namespaces", namespaces);

    return json;
  }
}

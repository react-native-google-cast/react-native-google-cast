package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.MediaQueueContainerMetadata;
import com.google.android.gms.cast.MediaQueueData;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.common.images.WebImage;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RNGCMediaQueueContainerMetadata {
  public static @Nullable
  MediaQueueContainerMetadata fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    MediaQueueContainerMetadata.Builder builder = new MediaQueueContainerMetadata.Builder();

    if (json.hasKey("containerDuration")) {
      builder.setContainerDuration(json.getDouble("containerDuration"));
    }

    if (json.hasKey("containerImages")) {
      final List<WebImage> images = new ArrayList<WebImage>();
      ReadableArray imagesArray = json.getArray("containerImages");
      for (int i = 0; i < imagesArray.size(); i++) {
        images.add(RNGCWebImage.fromJson(imagesArray.getMap(i)));
      }
      builder.setContainerImages(images);
    }

    if (json.hasKey("containerType")) {
      builder.setContainerType(RNGCMediaQueueContainerType.fromJson(json.getString("containerType")));
    }

    if (json.hasKey("sections")) {
      final List<MediaMetadata> sections = new ArrayList<>();
      ReadableArray sectionsArray = json.getArray("sections");
      for (int i = 0; i < sectionsArray.size(); i++) {
        sections.add(RNGCMediaMetadata.fromJson(sectionsArray.getMap(i)));
      }
      builder.setSections(sections);
    }

    if (json.hasKey("title")) {
      builder.setTitle(json.getString("title"));
    }

    return builder.build();
  }

  public static @Nullable
  WritableMap toJson(final @Nullable MediaQueueContainerMetadata metadata) {
    if (metadata == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putDouble("containerDuration", metadata.getContainerDuration());

    final WritableArray images = Arguments.createArray();
    if (metadata.getContainerImages() != null) {
      for (WebImage image : metadata.getContainerImages()) {
        images.pushMap(RNGCWebImage.toJson(image));
      }
    }
    json.putArray("containerImages", images);

    json.putString("containerType", RNGCMediaQueueContainerType.toJson(metadata.getContainerType()));

    final WritableArray sections = Arguments.createArray();
    if (metadata.getSections() != null) {
      for (MediaMetadata section : metadata.getSections()) {
        sections.pushMap(RNGCMediaMetadata.toJson(section));
      }
    }
    json.putArray("sections", sections);

    json.putString("title", metadata.getTitle());

    return json;
  }
}

package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaQueueContainerMetadata;
import com.google.android.gms.cast.MediaQueueData;

public class RNGCMediaQueueContainerType {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
      case "audioBook":
        return MediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_AUDIO_BOOK;
      default:
        return MediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_GENERIC;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
      case MediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_AUDIO_BOOK:
        return "audioBook";
      default:
        return null;
    }
  }
}

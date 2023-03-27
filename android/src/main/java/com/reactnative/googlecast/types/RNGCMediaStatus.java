package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.common.images.WebImage;

public class RNGCMediaStatus {
  public static @Nullable
  WritableMap toJson(final @Nullable MediaStatus status) {
    if (status == null) return null;

    final WritableMap json = Arguments.createMap();

    if (status.getActiveTrackIds() != null) {
      final WritableArray activeTrackIds = Arguments.createArray();
      for (long activeTrackId: status.getActiveTrackIds()) {
        activeTrackIds.pushInt((int) activeTrackId);
      }
      json.putArray("activeTrackIds", activeTrackIds);
    }

    json.putInt("currentItemId", status.getCurrentItemId());

    json.putMap("currentQueueItem",
      RNGCMediaQueueItem.toJson(
        status.getQueueItemById(status.getCurrentItemId())));

    json.putMap("customData", RNGCJSONObject.toJson(status.getCustomData()));

    json.putString("idleReason",
      RNGCMediaPlayerIdleReason.toJson(status.getIdleReason()));

    json.putBoolean("isMuted", status.isMute());

    if (status.getLiveSeekableRange() != null) {
      json.putMap("liveSeekableRange", RNGCMediaLiveSeekableRange.toJson(status.getLiveSeekableRange()));
    }

    if (status.getLoadingItemId() != MediaQueueItem.INVALID_ITEM_ID) {
      json.putInt("loadingItemId", status.getLoadingItemId());
    }

    json.putMap("mediaInfo", RNGCMediaInfo.toJson(status.getMediaInfo()));

    json.putDouble("playbackRate", status.getPlaybackRate());

    json.putString("playerState",
      RNGCPlayerState.toJson(status.getPlayerState()));

    if (status.getPreloadedItemId() != MediaQueueItem.INVALID_ITEM_ID) {
      json.putInt("preloadedItemId", status.getPreloadedItemId());
    }

    final WritableArray queueItems = Arguments.createArray();
    if (status.getQueueItems() != null) {
      for (MediaQueueItem item : status.getQueueItems()) {
        queueItems.pushMap(RNGCMediaQueueItem.toJson(item));
      }
    }
    json.putArray("queueItems", queueItems);

    json.putString("queueRepeatMode",
      RNGCMediaRepeatMode.toJson(status.getQueueRepeatMode()));

    json.putDouble("streamPosition", status.getStreamPosition() / 1000.0);

    json.putMap("videoInfo", RNGCVideoInfo.toJson(status.getVideoInfo()));

    json.putDouble("volume", status.getStreamVolume());

    return json;
  }
}

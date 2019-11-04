package com.reactnative.googlecast.types;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.common.images.WebImage;

public class RNGCMediaStatus {
  public static WritableMap toJson(final MediaStatus status) {
    final WritableMap json = Arguments.createMap();

    json.putInt("currentItemId", status.getCurrentItemId());

    json.putMap("currentQueueItem",
                RNGCMediaQueueItem.toJson(
                    status.getQueueItemById(status.getCurrentItemId())));

    json.putMap("customData", RNGCJSONObject.toJson(status.getCustomData()));

    json.putString("idleReason",
                   RNGCMediaPlayerIdleReason.toJson(status.getIdleReason()));

    json.putBoolean("isMuted", status.isMute());

    json.putInt("loadingItemId", status.getLoadingItemId());

    json.putMap("mediaInfo", RNGCMediaInfo.toJson(status.getMediaInfo()));

    json.putDouble("playbackRate", status.getPlaybackRate());

    json.putString("playerState",
                   RNGCPlayerState.toJson(status.getPlayerState()));

    json.putInt("preloadedItemId", status.getPreloadedItemId());

    final WritableArray queueItems = Arguments.createArray();
    for (MediaQueueItem item: status.getQueueItems()) {
      queueItems.pushMap(RNGCMediaQueueItem.toJson(item));
    }
    json.putArray("queueItems", queueItems);

    json.putString("queueRepeatMode",
                   RNGCMediaRepeatMode.toJson(status.getQueueRepeatMode()));

    json.putInt("streamPosition", (int)status.getStreamPosition());

    json.putMap("videoInfo", RNGCVideoInfo.toJson(status.getVideoInfo()));

    json.putDouble("volume", status.getStreamVolume());

    return json;
  }
}

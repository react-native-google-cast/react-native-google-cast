package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.cast.MediaLiveSeekableRange;

public class RNGCMediaLiveSeekableRange {
  public static @Nullable
  WritableMap toJson(final @Nullable MediaLiveSeekableRange liveSeekableRange) {
    if (liveSeekableRange == null) return null;

    final WritableMap json = Arguments.createMap();

    json.putDouble("endTime", liveSeekableRange.getEndTime() / 1000.0);

    json.putDouble("startTime", liveSeekableRange.getStartTime() / 1000.0);

    json.putBoolean("isLiveDone", liveSeekableRange.isLiveDone());

    json.putBoolean("isMovingWindow", liveSeekableRange.isMovingWindow());

    return json;
  }
}

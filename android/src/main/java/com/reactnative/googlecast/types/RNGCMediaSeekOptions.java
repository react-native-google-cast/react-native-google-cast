package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.cast.MediaSeekOptions;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;

public class RNGCMediaSeekOptions {
  public static @Nullable MediaSeekOptions fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    final MediaSeekOptions.Builder builder = new MediaSeekOptions.Builder();

    if (json.hasKey("customData")) {
      builder.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("infinite")) {
      builder.setIsSeekToInfinite(json.getBoolean("infinite"));
    }

    if (json.hasKey("position")) {
      long position = Math.round(json.getDouble("position") * 1000);

      if (json.hasKey("relative") && json.getBoolean("relative")) {
        builder.setPosition(getCurrentPosition() + position);
      } else {
        builder.setPosition(position);
      }
    }

    if (json.hasKey("resumeState")) {
      builder.setResumeState(RNGCMediaResumeState.fromJson(json.getString("resumeState")));
    }

    return builder.build();
  }

  private static long getCurrentPosition() {
    final CastSession session = CastContext.getSharedInstance().getSessionManager().getCurrentCastSession();
    if (session == null) { return 0; }
    final RemoteMediaClient client = session.getRemoteMediaClient();
    if (client == null) { return 0; }
    return client.getApproximateStreamPosition();
  }
}

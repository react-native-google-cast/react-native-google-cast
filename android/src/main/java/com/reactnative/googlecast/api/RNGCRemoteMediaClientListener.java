package com.reactnative.googlecast.api;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.reactnative.googlecast.types.RNGCMediaStatus;

public class RNGCRemoteMediaClientListener
    extends RemoteMediaClient.Callback {

  private RNGCRemoteMediaClient client;
  private boolean playbackStarted;
  private boolean playbackEnded;
  private int currentItemId;

  public RNGCRemoteMediaClientListener(RNGCRemoteMediaClient client) {
    this.client = client;
  }

  @Override
  public void onStatusUpdated() {
    client.with.withX(new With.WithX<RemoteMediaClient>() {
      @Override
      public void execute(RemoteMediaClient c) {
        MediaStatus mediaStatus = c.getMediaStatus();

        if (mediaStatus == null) {
          return;
        }

        if (currentItemId != mediaStatus.getCurrentItemId()) {
          // reset item status
          currentItemId = mediaStatus.getCurrentItemId();
          playbackStarted = false;
          playbackEnded = false;
        }

        client.sendEvent(RNGCRemoteMediaClient.MEDIA_STATUS_UPDATED,
          RNGCMediaStatus.toJson(mediaStatus));

        if (!playbackStarted &&
          mediaStatus.getPlayerState() == MediaStatus.PLAYER_STATE_PLAYING) {
          client.sendEvent(RNGCRemoteMediaClient.MEDIA_PLAYBACK_STARTED,
            RNGCMediaStatus.toJson(mediaStatus));
          playbackStarted = true;
        }

        if (!playbackEnded &&
          mediaStatus.getIdleReason() == MediaStatus.IDLE_REASON_FINISHED) {
          client.sendEvent(RNGCRemoteMediaClient.MEDIA_PLAYBACK_ENDED,
            RNGCMediaStatus.toJson(mediaStatus));
          playbackEnded = true;
        }
      }
    });
  }

  @Override
  public void onMetadataUpdated() {}

  @Override
  public void onQueueStatusUpdated() {}

  @Override
  public void onPreloadStatusUpdated() {}

  @Override
  public void onSendingRemoteMediaRequest() {}

  @Override
  public void onAdBreakStatusUpdated() {}
}

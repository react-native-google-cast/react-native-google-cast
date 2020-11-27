package com.reactnative.googlecast.api;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.reactnative.googlecast.types.RNGCJSONObject;
import com.reactnative.googlecast.types.RNGCMediaLoadRequest;
import com.reactnative.googlecast.types.RNGCMediaQueueItem;
import com.reactnative.googlecast.types.RNGCMediaSeekOptions;
import com.reactnative.googlecast.types.RNGCMediaStatus;
import com.reactnative.googlecast.types.RNGCTextTrackStyle;

import java.util.HashMap;
import java.util.Map;

public class RNGCRemoteMediaClient extends ReactContextBaseJavaModule {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCRemoteMediaClient";

  public static final String MEDIA_STATUS_UPDATED =
    "GoogleCast:MediaStatusUpdated";
  public static final String MEDIA_PLAYBACK_STARTED =
    "GoogleCast:MediaPlaybackStarted";
  public static final String MEDIA_PLAYBACK_ENDED =
    "GoogleCast:MediaPlaybackEnded";

  public RNGCRemoteMediaClient(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("MEDIA_STATUS_UPDATED", MEDIA_STATUS_UPDATED);
    constants.put("MEDIA_PLAYBACK_STARTED", MEDIA_PLAYBACK_STARTED);
    constants.put("MEDIA_PLAYBACK_ENDED", MEDIA_PLAYBACK_ENDED);

    return constants;
  }

  @ReactMethod
  public void getMediaStatus(final Promise promise) {
    with.withX(new With.WithX<RemoteMediaClient>() {
      @Override
      public void execute(RemoteMediaClient client) {
        promise.resolve(RNGCMediaStatus.toJson(client.getMediaStatus()));
      }
    }, promise);
  }

  @ReactMethod
  public void loadMedia(final ReadableMap request, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.load(RNGCMediaLoadRequest.fromJson(request));
      }
    }, promise);
  }

  @ReactMethod
  public void pause(final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.pause();
      }
    }, promise);
  }

  @ReactMethod
  public void play(final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.play();
      }
    }, promise);
  }

  @ReactMethod
  public void
  queueInsertAndPlayItem(final ReadableMap item, @Nullable final Integer beforeItemId,
                         @Nullable final Integer playPosition,
                         @Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.queueInsertAndPlayItem(
          RNGCMediaQueueItem.fromJson(item), beforeItemId, playPosition,
          RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void
  queueInsertItems(final ReadableArray items, @Nullable final Integer beforeItemId,
                   @Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        final MediaQueueItem[] queueItems = new MediaQueueItem[items.size()];
        for (int i = 0; i < items.size(); i++) {
          queueItems[i] = RNGCMediaQueueItem.fromJson(items.getMap(i));
        }

        return client.queueInsertItems(queueItems, beforeItemId,
          RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void queueNext(@Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.queueNext(RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void queuePrev(@Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.queuePrev(RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void seek(final ReadableMap options, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.seek(RNGCMediaSeekOptions.fromJson(options));
      }
    }, promise);
  }

  @ReactMethod
  public void setActiveMediaTracks(final ReadableArray trackIds, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        long[] ids = new long[trackIds.size()];
        for (int i = 0; i < trackIds.size(); i++) {
          ids[i] = (long) trackIds.getInt(i);
        }
        return client.setActiveMediaTracks(ids);
      }
    }, promise);
  }

  @ReactMethod
  public void setPlaybackRate(final double playbackRate, final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.setPlaybackRate(playbackRate, RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void setStreamMuted(final boolean muted, final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.setStreamMute(muted, RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void setStreamVolume(final double volume, final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.setStreamVolume(volume, RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void setTextTrackStyle(final ReadableMap textTrackStyle, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.setTextTrackStyle(RNGCTextTrackStyle.fromJson(textTrackStyle));
      }
    }, promise);
  }

  @ReactMethod
  public void stop(final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.stop(RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  protected With<RemoteMediaClient> with = new With<RemoteMediaClient>() {
    @Override
    protected RemoteMediaClient getX() {
      final CastSession castSession = CastContext.getSharedInstance(getReactApplicationContext())
        .getSessionManager()
        .getCurrentCastSession();

      if (castSession == null) {
        throw new IllegalStateException(("No castSession!"));
      }

      final RemoteMediaClient client = castSession.getRemoteMediaClient();

      if (client == null) {
        throw new IllegalStateException(("No remoteMediaClient!"));
      }

      return client;
    }

    @Override
    protected ReactContext getReactApplicationContext() {
      return RNGCRemoteMediaClient.this.getReactApplicationContext();
    }
  };

  protected void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  protected void runOnUiQueueThread(Runnable runnable) {
    getReactApplicationContext().runOnUiQueueThread(runnable);
  }
}

package com.reactnative.googlecast.api;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.Session;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.PendingResult;
import com.reactnative.googlecast.types.RNGCJSONObject;
import com.reactnative.googlecast.types.RNGCMediaLoadRequest;
import com.reactnative.googlecast.types.RNGCMediaQueueItem;
import com.reactnative.googlecast.types.RNGCMediaSeekOptions;
import com.reactnative.googlecast.types.RNGCMediaStatus;
import com.reactnative.googlecast.types.RNGCTextTrackStyle;

import java.util.HashMap;
import java.util.Map;

public class RNGCRemoteMediaClient extends ReactContextBaseJavaModule implements LifecycleEventListener {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCRemoteMediaClient";

  private boolean mListenersAttached = false;

  public static final String MEDIA_PROGRESS_UPDATED =
    "GoogleCast:MediaProgressUpdated";
  public static final String MEDIA_STATUS_UPDATED =
    "GoogleCast:MediaStatusUpdated";

  public RNGCRemoteMediaClient(ReactApplicationContext reactContext) {
    super(reactContext);

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("MEDIA_PROGRESS_UPDATED", MEDIA_PROGRESS_UPDATED);
    constants.put("MEDIA_STATUS_UPDATED", MEDIA_STATUS_UPDATED);

    return constants;
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Set up any upstream listeners or background tasks as necessary
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Remove upstream listeners, stop unnecessary background tasks
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
  public void getStreamPosition(final Promise promise) {
    with.withX(new With.WithX<RemoteMediaClient>() {
      @Override
      public void execute(RemoteMediaClient client) {
        final MediaStatus status = client.getMediaStatus();
        if (status == null || status.getPlayerState() == MediaStatus.PLAYER_STATE_IDLE || status.getPlayerState() == MediaStatus.PLAYER_STATE_UNKNOWN) {
          promise.resolve(null);
        } else {
          promise.resolve(client.getApproximateStreamPosition() / 1000.0);
        }
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
  public void pause(@Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.pause(RNGCJSONObject.fromJson(customData));
      }
    }, promise);
  }

  @ReactMethod
  public void play(@Nullable final ReadableMap customData, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.play(RNGCJSONObject.fromJson(customData));
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
  public void requestStatus(final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.requestStatus();
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
  public void setActiveTrackIds(final ReadableArray trackIds, final Promise promise) {
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
  public void setProgressUpdateInterval(final Double interval, final Promise promise) {
    with.withX(new With.WithX<RemoteMediaClient>() {
      @Override
      public void execute(RemoteMediaClient client) {
        client.removeProgressListener(progressListener);
        if (interval == null || interval <= 0) return;
        client.addProgressListener(progressListener, Math.round(interval * 1000));
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
    protected @Nullable RemoteMediaClient getX() {
      final CastSession castSession = CastContext.getSharedInstance(getReactApplicationContext())
        .getSessionManager()
        .getCurrentCastSession();

      if (castSession == null) return null;

      return castSession.getRemoteMediaClient();
    }

    @Override
    protected ReactContext getReactApplicationContext() {
      return RNGCRemoteMediaClient.this.getReactApplicationContext();
    }
  };

  private void sendEvent(@NonNull String eventName, @Nullable Object params) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  private RemoteMediaClient.Callback clientCallback = new RemoteMediaClient.Callback() {
    @Override
    public void onStatusUpdated() {
      with.withX(new With.WithX<RemoteMediaClient>() {
        @Override
        public void execute(RemoteMediaClient client) {
          final MediaStatus status = client.getMediaStatus();

          sendEvent(RNGCRemoteMediaClient.MEDIA_STATUS_UPDATED,
            RNGCMediaStatus.toJson(status));

          if (status == null || status.getPlayerState() == MediaStatus.PLAYER_STATE_IDLE || status.getPlayerState() == MediaStatus.PLAYER_STATE_UNKNOWN) {
            final WritableArray progress = Arguments.createArray();
            progress.pushNull();
            progress.pushNull();
            sendEvent(MEDIA_PROGRESS_UPDATED, progress);
          }
        }
      });
    }
  };

  private RemoteMediaClient.ProgressListener progressListener = new RemoteMediaClient.ProgressListener() {
    @Override
    public void onProgressUpdated(long progressMs, long durationMs) {
      sendEvent(MEDIA_PROGRESS_UPDATED, Arguments.fromArray(new double[]{progressMs / 1000.0, durationMs / 1000.0}));
    }
  };

  private SessionManagerListener sessionListener = new CastSessionManagerListener() {
    @Override
    public void onSessionResumed(CastSession session, boolean wasSuspended) {
      session.getRemoteMediaClient().registerCallback(clientCallback);
    }

    @Override
    public void onSessionStarted(CastSession session, String sessionId) {
      session.getRemoteMediaClient().registerCallback(clientCallback);
    }
  };

  @Override
  public void onHostResume() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (mListenersAttached || !RNGCCastContext.isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = CastContext.getSharedInstance(context)
          .getSessionManager();
        sessionManager.addSessionManagerListener(sessionListener);

        CastSession session = sessionManager.getCurrentCastSession();
        if (session != null && session.getRemoteMediaClient() != null) {
          session.getRemoteMediaClient().registerCallback(clientCallback);
        }
      }
    });
    mListenersAttached = true;
  }

  @Override
  public void onHostDestroy() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (!RNGCCastContext.isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = CastContext.getSharedInstance(context)
          .getSessionManager();
        sessionManager.removeSessionManagerListener(sessionListener);

        CastSession session = sessionManager.getCurrentCastSession();
        if (session != null && session.getRemoteMediaClient() != null) {
          session.getRemoteMediaClient().unregisterCallback(clientCallback);
        }
      }
    });
    mListenersAttached = false;
  }

  @Override
  public void onHostPause() {
  }
}

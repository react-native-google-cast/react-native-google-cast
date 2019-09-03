package com.reactnative.googlecast.api;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.reactnative.googlecast.types.RNGCMediaInfo;
import com.reactnative.googlecast.types.RNGCMediaLoadOptions;

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

  protected void sendEvent(String eventName) {
    this.sendEvent(eventName, null);
  }

  protected void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  protected void runOnUiQueueThread(Runnable runnable) {
    getReactApplicationContext().runOnUiQueueThread(runnable);
  }

  @ReactMethod
  public void loadMedia(final ReadableMap mediaInfo,
                        final ReadableMap loadOptions, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.load(RNGCMediaInfo.fromJson(mediaInfo),
                           RNGCMediaLoadOptions.fromJson(loadOptions));
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
  public void pause(final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.pause();
      }
    }, promise);
  }

  @ReactMethod
  public void stop(final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.stop();
      }
    }, promise);
  }

  @ReactMethod
  public void seek(final int position, final Promise promise) {
    with.withX(new With.WithXPromisify<RemoteMediaClient>() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.seek(position * 1000);
      }
    }, promise);
  }

  protected With<RemoteMediaClient> with = new With<RemoteMediaClient>() {
    @Override
    protected RemoteMediaClient getX() {
      final CastSession castSession = CastContext.getSharedInstance()
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
      return getReactApplicationContext();
    }
  };
}

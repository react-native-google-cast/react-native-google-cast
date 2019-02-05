package com.reactnative.googlecast.api;

import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.images.WebImage;
import com.reactnative.googlecast.api.convert.RNGCMediaInfo;
import com.reactnative.googlecast.api.convert.RNGCMediaLoadOptions;

public class RNGCRemoteMediaClient extends ReactContextBaseJavaModule {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCRemoteMediaClient";

  public RNGCRemoteMediaClient(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @ReactMethod
  public void loadMedia(final ReadableMap mediaInfo,
                        final ReadableMap loadOptions, final Promise promise) {
    withClient(new WithClient() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.load(RNGCMediaInfo.fromJson(mediaInfo),
                           RNGCMediaLoadOptions.fromJson(loadOptions));
      }
    }, promise);
  }

  @ReactMethod
  public void play(final Promise promise) {
    withClient(new WithClient() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.play();
      }
    }, promise);
  }

  @ReactMethod
  public void pause(final Promise promise) {
    withClient(new WithClient() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.pause();
      }
    }, promise);
  }

  @ReactMethod
  public void stop(final Promise promise) {
    withClient(new WithClient() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.stop();
      }
    }, promise);
  }

  @ReactMethod
  public void seek(final int position, final Promise promise) {
    withClient(new WithClient() {
      @Override
      public PendingResult execute(RemoteMediaClient client) {
        return client.seek(position * 1000);
      }
    }, promise);
  }

  private interface WithClient {
    PendingResult execute(RemoteMediaClient client);
  }

  private void withClient(final WithClient runnable, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        final CastSession castSession = CastContext.getSharedInstance()
          .getSessionManager()
          .getCurrentCastSession();

        if (castSession == null) {
          promise.reject(new IllegalStateException(("No castSession!")));
          return;
        }

        final RemoteMediaClient client = castSession.getRemoteMediaClient();

        if (client == null) {
          promise.reject(new IllegalStateException(("No remoteMediaClient!")));
          return;
        }

        RNGCPendingResult.promisifyResult(runnable.execute(client), promise);
      }
    });
  }
}

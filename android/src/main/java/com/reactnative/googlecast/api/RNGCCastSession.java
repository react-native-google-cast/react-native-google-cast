package com.reactnative.googlecast.api;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.reactnative.googlecast.types.RNGCActiveInputState;
import com.reactnative.googlecast.types.RNGCApplicationMetadata;
import com.reactnative.googlecast.types.RNGCDevice;
import com.reactnative.googlecast.types.RNGCJSONObject;
import com.reactnative.googlecast.types.RNGCMediaTextTrackSubtype;
import com.reactnative.googlecast.types.RNGCMediaTrackType;
import com.reactnative.googlecast.types.RNGCStandbyState;

import java.util.HashMap;
import java.util.Map;

public class RNGCCastSession extends ReactContextBaseJavaModule {

  @VisibleForTesting public static final String REACT_CLASS = "RNGCCastSession";

  public RNGCCastSession(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    return constants;
  }

  @ReactMethod
  public void getActiveInputState(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(
            RNGCActiveInputState.toJson(castSession.getActiveInputState()));
      }
    }, promise);
  }

  @ReactMethod
  public void getApplicationMetadata(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(RNGCApplicationMetadata.toJson(
            castSession.getApplicationMetadata()));
      }
    }, promise);
  }

  @ReactMethod
  public void getApplicationStatus(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(castSession.getApplicationStatus());
      }
    }, promise);
  }

  @ReactMethod
  public void getCastDevice(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(RNGCDevice.toJson(castSession.getCastDevice()));
      }
    }, promise);
  }

  @ReactMethod
  public void getStandbyState(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(RNGCStandbyState.toJson(castSession.getStandbyState()));
      }
    }, promise);
  }

  @ReactMethod
  public void getVolume(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(castSession.getVolume());
      }
    }, promise);
  }

  @ReactMethod
  public void isMute(final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        promise.resolve(castSession.isMute());
      }
    }, promise);
  }

  @ReactMethod
  public void sendMessage(final String namespace, final String message,
                          final Promise promise) {
    with.withX(new With.WithXPromisify<CastSession>() {
      @Override
      public PendingResult execute(CastSession castSession) {
        return castSession.sendMessage(namespace, message);
      }
    }, promise);
  }

  private With<CastSession> with = new With<CastSession>() {
    @Override
    protected CastSession getX() {
      final CastSession castSession = CastContext.getSharedInstance()
        .getSessionManager()
        .getCurrentCastSession();

      if (castSession == null) {
        throw new IllegalStateException(("No castSession!"));
      }

      return castSession;
    }

    @Override
    protected ReactContext getReactApplicationContext() {
      return getReactApplicationContext();
    }
  };

  public static WritableMap toJson(final CastSession castSession) {
    if (castSession == null) return null;

    final WritableMap json = Arguments.createMap();

    json.putString("id", castSession.getSessionId());

    return json;
  }
}

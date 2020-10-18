package com.reactnative.googlecast.api;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.CastStatusCodes;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;

import java.util.HashMap;
import java.util.Map;

public class RNGCSessionManager
  extends ReactContextBaseJavaModule implements LifecycleEventListener, SessionManagerListener<CastSession> {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCSessionManager";

  public static final String SESSION_STARTING = "GoogleCast:SessionStarting";
  public static final String SESSION_STARTED = "GoogleCast:SessionStarted";
  public static final String SESSION_START_FAILED =
    "GoogleCast:SessionStartFailed";
  public static final String SESSION_SUSPENDED = "GoogleCast:SessionSuspended";
  public static final String SESSION_RESUMING = "GoogleCast:SessionResuming";
  public static final String SESSION_RESUMED = "GoogleCast:SessionResumed";
  public static final String SESSION_ENDING = "GoogleCast:SessionEnding";
  public static final String SESSION_ENDED = "GoogleCast:SessionEnded";

  public RNGCSessionManager(ReactApplicationContext reactContext) {
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

    constants.put("SESSION_STARTING", SESSION_STARTING);
    constants.put("SESSION_STARTED", SESSION_STARTED);
    constants.put("SESSION_START_FAILED", SESSION_START_FAILED);
    constants.put("SESSION_SUSPENDED", SESSION_SUSPENDED);
    constants.put("SESSION_RESUMING", SESSION_RESUMING);
    constants.put("SESSION_RESUMED", SESSION_RESUMED);
    constants.put("SESSION_ENDING", SESSION_ENDING);
    constants.put("SESSION_ENDED", SESSION_ENDED);

    return constants;
  }

  @ReactMethod
  public void getCurrentCastSession(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        promise.resolve(RNGCCastSession.toJson(getSessionManager().getCurrentCastSession()));
      }
    });
  }

  @Override
  public void onSessionEnded(CastSession session, int error) {
    onDisconnected();

    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));
    params.putString("error", CastStatusCodes.getStatusCodeString(error));

    sendEvent(SESSION_ENDED, params);
  }

  @Override
  public void onSessionResumed(CastSession session, boolean wasSuspended) {
    onConnected(session);

    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_RESUMED, params);
  }

  @Override
  public void onSessionResumeFailed(CastSession session, int error) {
    onDisconnected();
    // TODO: find corresponding iOS event
  }

  @Override
  public void onSessionStarted(CastSession session, String sessionId) {
    onConnected(session);

    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_STARTED, params);
  }

  @Override
  public void onSessionStartFailed(CastSession session, int error) {
    onDisconnected();

    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));
    params.putString("error", CastStatusCodes.getStatusCodeString(error));

    sendEvent(SESSION_START_FAILED, params);
  }

  @Override
  public void onSessionStarting(CastSession session) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_STARTING, params);
  }

  @Override
  public void onSessionEnding(CastSession session) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_ENDING, params);
  }

  @Override
  public void onSessionResuming(CastSession session, String sessionId) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_RESUMING, params);
  }

  @Override
  public void onSessionSuspended(CastSession session, int reason) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));
    // TODO params.putString("reason", );

    sendEvent(SESSION_SUSPENDED, params);
  }

  @Override
  public void onHostResume() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        getSessionManager().addSessionManagerListener(RNGCSessionManager.this,
          CastSession.class);
      }
    });
  }

  @Override
  public void onHostPause() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        getSessionManager().removeSessionManagerListener(RNGCSessionManager.this,
          CastSession.class);
      }
    });
  }

  @Override
  public void onHostDestroy() {
  }

  public void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  private void onConnected(final CastSession castSession) {
//    this.castSession = castSession;

//    remoteMediaClientListener = new RNGCRemoteMediaClientListener(module);
//    castSession.getRemoteMediaClient().registerCallback(
//        remoteMediaClientListener);
  }

  private void onDisconnected() {
//    this.castSession = null;
  }

  private SessionManager getSessionManager() {
    return CastContext.getSharedInstance(getReactApplicationContext())
      .getSessionManager();
  }
}

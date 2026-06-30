package com.reactnative.googlecast.api;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.mediarouter.media.MediaRouter;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.CastStatusCodes;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastReasonCodes;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.Session;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.reactnative.googlecast.types.RNGCDevice;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

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

  private boolean mListenersAttached = false;

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
  public void addListener(String eventName) {
    // Set up any upstream listeners or background tasks as necessary
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Remove upstream listeners, stop unnecessary background tasks
  }

  @ReactMethod
  public void endCurrentSession(final boolean stopCasting, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = getSessionManager();
        if (sessionManager != null) {
          sessionManager.endCurrentSession(stopCasting);
        }
        promise.resolve(null);
      }
    });
  }

  @ReactMethod
  public void getCurrentCastSession(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = getSessionManager();
        promise.resolve(sessionManager == null ? null : RNGCCastSession.toJson(sessionManager.getCurrentCastSession()));
      }
    });
  }

  @ReactMethod
  public void startSession(final String deviceId, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouter router = MediaRouter.getInstance(getReactApplicationContext());
        for (MediaRouter.RouteInfo routeInfo : router.getRoutes()) {
          CastDevice device = CastDevice.getFromBundle(routeInfo.getExtras());
          if (device != null && device.getDeviceId().equals(deviceId)) {
            router.selectRoute(routeInfo);
            promise.resolve(true);
            return;
          }
        }
        promise.resolve(false);
      };
    });
  }

  @Override
  public void onSessionEnded(CastSession session, int error) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        WritableMap params = Arguments.createMap();

        params.putMap("session", RNGCCastSession.toJson((session)));

        CastContext castContext = RNGCCastContext.getSharedInstance(getReactApplicationContext());

        if (castContext != null) {
          Integer reasonCode = castContext.getCastReasonCodeForCastStatusCode(error);
          params.putInt("errorReasonCode", reasonCode);
        }

        if (castContext == null || CastReasonCodes.CASTING_STOPPED != castContext.getCastReasonCodeForCastStatusCode(error)) {
          params.putString("error", CastStatusCodes.getStatusCodeString(error));
        }

        sendEvent(SESSION_ENDED, params);
      }
    });
  }

  @Override
  public void onSessionResumed(CastSession session, boolean wasSuspended) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_RESUMED, params);
  }

  @Override
  public void onSessionResumeFailed(CastSession session, int error) {
    // TODO: find corresponding iOS event
  }

  @Override
  public void onSessionStarted(CastSession session, String sessionId) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));

    sendEvent(SESSION_STARTED, params);
  }

  @Override
  public void onSessionStartFailed(CastSession session, int error) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));
    params.putString("error", CastStatusCodes.getStatusCodeString(error));

    CastContext castContext = RNGCCastContext.getSharedInstance(getReactApplicationContext());
    if (castContext != null) {
      Integer reasonCode = castContext.getCastReasonCodeForCastStatusCode(error);
      params.putInt("errorReasonCode", reasonCode);
    }

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
  public void onSessionSuspended(CastSession session, int errorCode) {
    WritableMap params = Arguments.createMap();

    params.putMap("session", RNGCCastSession.toJson((session)));
    params.putInt("errorCode", errorCode);

    CastContext castContext = RNGCCastContext.getSharedInstance(getReactApplicationContext());
    if (castContext != null) {
      Integer reasonCode = castContext.getCastReasonCodeForCastStatusCode(errorCode);
      params.putInt("errorReasonCode", reasonCode);
    }

    sendEvent(SESSION_SUSPENDED, params);
  }

  @Override
  public void onHostResume() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (mListenersAttached) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = getSessionManager();
        if (sessionManager != null) {
            sessionManager.addSessionManagerListener(RNGCSessionManager.this, CastSession.class);
            mListenersAttached = true;
        } else {
            mListenersAttached = false;
        }
      }
    });
  }

  @Override
  public void onHostDestroy() {
    final ReactApplicationContext context = getReactApplicationContext();

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = getSessionManager();
        if (sessionManager != null) {
          sessionManager.removeSessionManagerListener(RNGCSessionManager.this, CastSession.class);
        }
        mListenersAttached = false;
      }
    });
  }

  @Override
  public void onHostPause() {
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  @Nullable
  private SessionManager getSessionManager() {
    CastContext castContext = RNGCCastContext.getSharedInstance(getReactApplicationContext());
    if (castContext == null) { return null; }
    return castContext.getSessionManager();
  }
}

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
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.Session;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.reactnative.googlecast.types.RNGCActiveInputState;
import com.reactnative.googlecast.types.RNGCApplicationMetadata;
import com.reactnative.googlecast.types.RNGCDevice;
import com.reactnative.googlecast.types.RNGCJSONObject;
import com.reactnative.googlecast.types.RNGCMediaTextTrackSubtype;
import com.reactnative.googlecast.types.RNGCMediaTrackType;
import com.reactnative.googlecast.types.RNGCStandbyState;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class RNGCCastSession extends ReactContextBaseJavaModule implements LifecycleEventListener {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCCastSession";

  private boolean mListenersAttached = false;

  public RNGCCastSession(ReactApplicationContext reactContext) {
    super(reactContext);

    reactContext.addLifecycleEventListener(this);
  }

  private @Nullable
  CastSession castSession;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private static final String ACTIVE_INPUT_STATE_CHANGED = "GoogleCast:ActiveInputStateChanged";
  private static final String CHANNEL_MESSAGE_RECEIVED = "GoogleCast:ChannelMessageReceived";
  private static final String CHANNEL_UPDATED = "GoogleCast:ChannelUpdated";
  private static final String STANDBY_STATE_CHANGED = "GoogleCast:StandbyStateChanged";

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("ACTIVE_INPUT_STATE_CHANGED", ACTIVE_INPUT_STATE_CHANGED);
    constants.put("CHANNEL_MESSAGE_RECEIVED", CHANNEL_MESSAGE_RECEIVED);
    constants.put("CHANNEL_UPDATED", CHANNEL_UPDATED);
    constants.put("STANDBY_STATE_CHANGED", STANDBY_STATE_CHANGED);

    return constants;
  }

  private void sendEvent(@NonNull String eventName, @Nullable Object params) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
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
  public void setMute(final boolean mute, final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        try {
          castSession.setMute(mute);
          promise.resolve(null);
        } catch (IOException e) {
          promise.reject(e);
        }
      }
    }, promise);
  }

  @ReactMethod
  public void setVolume(final double volume, final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        try {
          castSession.setVolume(volume);
          promise.resolve(null);
        } catch (IOException e) {
          promise.reject(e);
        }
      }
    }, promise);
  }

  // CHANNELS

  @ReactMethod
  public void addChannel(final String namespace, final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        try {
          castSession.setMessageReceivedCallbacks(namespace, messageCallback);
          final WritableMap json = Arguments.createMap();
          json.putBoolean("connected", true);
          json.putString("namespace", namespace);
          json.putBoolean("writable", true);
          promise.resolve(json);
        } catch (IOException e) {
          promise.reject(e);
        }
      }
    }, promise);
  }

  @ReactMethod
  public void removeChannel(final String namespace, final Promise promise) {
    with.withX(new With.WithX<CastSession>() {
      @Override
      public void execute(CastSession castSession) {
        try {
          castSession.removeMessageReceivedCallbacks(namespace);
          promise.resolve(null);
        } catch (IOException e) {
          promise.reject(e);
        }
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
      return castSession;
    }

    @Override
    protected ReactContext getReactApplicationContext() {
      return RNGCCastSession.this.getReactApplicationContext();
    }
  };

  public static WritableMap toJson(final CastSession castSession) {
    if (castSession == null) return null;

    final WritableMap json = Arguments.createMap();
    json.putString("id", castSession.getSessionId());
    return json;
  }

  private Cast.Listener castListener = new Cast.Listener() {
    @Override
    public void onActiveInputStateChanged(int i) {
      sendEvent(ACTIVE_INPUT_STATE_CHANGED, RNGCActiveInputState.toJson(i));
    }

    @Override
    public void onStandbyStateChanged(int i) {
      sendEvent(STANDBY_STATE_CHANGED, RNGCStandbyState.toJson(i));
    }
  };

  private Cast.MessageReceivedCallback messageCallback = new Cast.MessageReceivedCallback() {
    @Override
    public void onMessageReceived(CastDevice castDevice, String namespace, String message) {
      WritableMap json = Arguments.createMap();
      json.putString("namespace", namespace);
      json.putString("message", message);
      sendEvent(CHANNEL_MESSAGE_RECEIVED, json);
    }
  };

  private SessionManagerListener sessionListener = new CastSessionManagerListener() {
    @Override
    public void onSessionEnding(CastSession castSession) {
      castSession.removeCastListener(castListener);
      RNGCCastSession.this.castSession = null;
    }

    @Override
    public void onSessionResumed(CastSession castSession, boolean wasSuspended) {
      castSession.addCastListener(castListener);
      RNGCCastSession.this.castSession = castSession;
    }

    @Override
    public void onSessionStarted(CastSession castSession, String s) {
      castSession.addCastListener(castListener);
      RNGCCastSession.this.castSession = castSession;
    }
  };

  @Override
  public void onHostResume() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (mListenersAttached || !RNGCCastContext.isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager = CastContext.getSharedInstance(context).getSessionManager();
        sessionManager.addSessionManagerListener(sessionListener);

        castSession = sessionManager.getCurrentCastSession();
        if (castSession != null) {
          castSession.addCastListener(castListener);
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
        SessionManager sessionManager = CastContext.getSharedInstance(context).getSessionManager();
        sessionManager.removeSessionManagerListener(sessionListener);

        castSession = sessionManager.getCurrentCastSession();
        if (castSession != null) {
          castSession.removeCastListener(castListener);
        }
      }
    });
    mListenersAttached = false;
  }

  @Override
  public void onHostPause() {
  }
}

package com.reactnative.googlecast.api;

import static android.content.Context.UI_MODE_SERVICE;

import android.app.UiModeManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.mediarouter.app.MediaRouteButton;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastStateListener;
import com.google.android.gms.cast.framework.IntroductoryOverlay;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.tasks.Task;
import com.reactnative.googlecast.RNGCExpandedControllerActivity;
import com.reactnative.googlecast.components.RNGoogleCastButtonManager;
import com.reactnative.googlecast.types.RNGCCastState;
import com.reactnative.googlecast.types.RNGCPlayServicesState;

import java.util.HashMap;
import java.util.Map;

public class RNGCCastContext
  extends ReactContextBaseJavaModule implements LifecycleEventListener {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCCastContext";

  private boolean mListenersAttached = false;

  public RNGCCastContext(final ReactApplicationContext reactContext) {
    super(reactContext);

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private static final String CAST_STATE_CHANGED = "GoogleCast:CastStateChanged";
  private CastStateListener castStateListener = new CastStateListener() {
    @Override
    public void onCastStateChanged(int i) {
      sendEvent(CAST_STATE_CHANGED, RNGCCastState.toJson(i));
    }
  };

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("CAST_STATE_CHANGED", CAST_STATE_CHANGED);

    return constants;
  }

  public void sendEvent(@NonNull String eventName, @Nullable Object params) {
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
  public void getCastState(final Promise promise) {
    final ReactApplicationContext context = getReactApplicationContext();
    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        if (isCastApiAvailable(context)) {
          CastContext castContext =
            CastContext.getSharedInstance(context);
          promise.resolve(RNGCCastState.toJson(castContext.getCastState()));
        } else {
          promise.resolve(null);
        }
      }
    });
  }

  @ReactMethod
  public void getPlayServicesState(final Promise promise) {
    final ReactApplicationContext context = getReactApplicationContext();
    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        int state = getGooglePlayServicesState(context);
        promise.resolve(RNGCPlayServicesState.toJson(state));
      }
    });
  }

  @ReactMethod
  public void showCastDialog(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouteButton button = RNGoogleCastButtonManager.getCurrent();
        if (button != null) {
          button.performClick();
          promise.resolve(true);
        } else {
          promise.resolve(false);
        }
      }
    });
  }

  @ReactMethod
  public void showExpandedControls() {
    ReactApplicationContext context = getReactApplicationContext();
    Intent intent =
      new Intent(context, RNGCExpandedControllerActivity.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent);
  }

  @ReactMethod
  public void showIntroductoryOverlay(final ReadableMap options, final Promise promise) {
    final MediaRouteButton button = RNGoogleCastButtonManager.getCurrent();

    if ((button != null) && button.getVisibility() == View.VISIBLE) {
      getReactApplicationContext().runOnUiQueueThread(new Runnable() {
        @Override
        public void run() {
          IntroductoryOverlay.Builder builder = new IntroductoryOverlay.Builder(getCurrentActivity(), button);

          if (options.getBoolean("once")) {
            builder.setSingleTime();
          }

          builder.setOnOverlayDismissedListener(
            new IntroductoryOverlay.OnOverlayDismissedListener() {
              @Override
              public void onOverlayDismissed() {
                promise.resolve(true);
              }
            });

          IntroductoryOverlay overlay = builder.build();

          overlay.show();
        }
      });
    }
  }

  @ReactMethod
  public void showPlayServicesErrorDialog(final String state, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        final boolean shown = GoogleApiAvailability.getInstance().showErrorDialogFragment(getCurrentActivity(), RNGCPlayServicesState.fromJson(state), 0);
        promise.resolve(shown);
      }
    });
  }

  @Override
  public void onHostResume() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (mListenersAttached || !isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        CastContext castContext = CastContext.getSharedInstance(context);
        castContext.addCastStateListener(castStateListener);
      }
    });

    mListenersAttached = true;
  }

  @Override
  public void onHostDestroy() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (!isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        CastContext castContext = CastContext.getSharedInstance(context);
        castContext.removeCastStateListener(castStateListener);
      }
    });
    mListenersAttached = false;
  }

  @Override
  public void onHostPause() {
  }

  protected static boolean isCastApiAvailable(Context context) {
    return !isTv(context) && isGooglePlayServiceAvailable(context);
  }

  private static boolean isTv(Context context) {
    UiModeManager uiModeManager = (UiModeManager) context.getSystemService(UI_MODE_SERVICE);
    return uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
  }

  private static boolean isGooglePlayServiceAvailable(Context context) {
    int state = getGooglePlayServicesState(context);
    return state == ConnectionResult.SUCCESS;
  }

  private static int getGooglePlayServicesState(Context context) {
    return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context);
  }
}

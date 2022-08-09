package com.reactnative.googlecast.api;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.mediarouter.media.MediaRouteSelector;
import androidx.mediarouter.media.MediaRouter;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastContext;
import com.reactnative.googlecast.types.RNGCDevice;

import java.util.HashMap;
import java.util.Map;

public class RNGCDiscoveryManager
  extends ReactContextBaseJavaModule implements LifecycleEventListener {

  @VisibleForTesting
  public static final String REACT_CLASS = "RNGCDiscoveryManager";

  public static final String DEVICES_UPDATED = "GoogleCast:DevicesUpdated";

  private boolean mListenersAttached = false;

  private MediaRouter.Callback mediaRouterCallback = new MediaRouter.Callback() {
    @Override
    public void onRouteAdded(MediaRouter router, MediaRouter.RouteInfo route) {
      super.onRouteAdded(router, route);
      sendEvent(DEVICES_UPDATED, getDevices());
    }

    @Override
    public void onRouteRemoved(MediaRouter router, MediaRouter.RouteInfo route) {
      super.onRouteRemoved(router, route);
      sendEvent(DEVICES_UPDATED, getDevices());
    }

    @Override
    public void onRouteChanged(MediaRouter router, MediaRouter.RouteInfo route) {
      super.onRouteChanged(router, route);
      sendEvent(DEVICES_UPDATED, getDevices());
    }
  };


  public RNGCDiscoveryManager(ReactApplicationContext reactContext) {
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

    constants.put("DEVICES_UPDATED", DEVICES_UPDATED);

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
  public void getDevices(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        promise.resolve(getDevices());
      }
    });
  }

  @ReactMethod
  public void isPassiveScan(final Promise promise) {
    promise.resolve(false);
  }

  @ReactMethod
  public void isRunning(final Promise promise) {
    promise.resolve(true);
  }

  @ReactMethod
  public void setPassiveScan(final boolean on, final Promise promise) {
    promise.resolve(null);
  }

  @ReactMethod
  public void startDiscovery(final Promise promise) {
    promise.resolve(null);
  }

  @ReactMethod
  public void stopDiscovery(final Promise promise) {
    promise.resolve(null);
  }

  @Override
  public void onHostResume() {
    final ReactApplicationContext context = getReactApplicationContext();

    if (mListenersAttached || !RNGCCastContext.isCastApiAvailable(context)) return;

    context.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouteSelector selector = CastContext.getSharedInstance().getMergedSelector();
        MediaRouter.getInstance(context).addCallback(selector, mediaRouterCallback);
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
        MediaRouter.getInstance(context).removeCallback(mediaRouterCallback);
      }
    });
    mListenersAttached = false;
  }

  @Override
  public void onHostPause() {
  }

  private WritableArray getDevices() {
    final WritableArray devices = Arguments.createArray();

    MediaRouter router = MediaRouter.getInstance(getReactApplicationContext());

    for (MediaRouter.RouteInfo routeInfo : router.getRoutes()) {
      // https://stackoverflow.com/a/57748577/384349
      Bundle extras = routeInfo.getExtras();
      CastDevice device = CastDevice.getFromBundle(extras);

      if (device == null) continue;
      if (extras == null) continue;
      if (routeInfo.isDefault()) continue;
      if (routeInfo.getDescription().equals("Google Cast Multizone Member")) continue;
      if (routeInfo.getPlaybackType() != MediaRouter.RouteInfo.PLAYBACK_TYPE_REMOTE) continue;
      if (extras.getString("com.google.android.gms.cast.EXTRA_SESSION_ID") != null) continue;

      devices.pushMap(RNGCDevice.toJson(device));
    }

    return devices;
  }

  private void sendEvent(String eventName, @Nullable Object data) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, data);
  }
}

package com.reactnative.googlecast.api;

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
    if (mListenersAttached) {
      return;
    }

    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouteSelector selector = CastContext.getSharedInstance().getMergedSelector();
        MediaRouter.getInstance(getReactApplicationContext()).addCallback(selector, mediaRouterCallback);
      }
    });
    mListenersAttached = true;
  }

  @Override
  public void onHostDestroy() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouter.getInstance(getReactApplicationContext()).removeCallback(mediaRouterCallback);
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
      CastDevice device = CastDevice.getFromBundle(routeInfo.getExtras());
      if (device != null) {
        devices.pushMap(RNGCDevice.toJson(device));
      }
    }

    return devices;
  }

  private void sendEvent(String eventName, @Nullable Object data) {
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, data);
  }
}

package com.reactlibrary;

import android.support.annotation.Nullable;
import android.support.v7.media.MediaRouter;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.google.android.gms.cast.ApplicationMetadata;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.libraries.cast.companionlibrary.cast.CastConfiguration;
import com.google.android.libraries.cast.companionlibrary.cast.VideoCastManager;
import com.google.android.libraries.cast.companionlibrary.cast.callbacks.VideoCastConsumer;
import com.google.android.libraries.cast.companionlibrary.cast.callbacks.VideoCastConsumerImpl;
import com.google.android.libraries.cast.companionlibrary.cast.exceptions.CastException;
import com.google.android.libraries.cast.companionlibrary.cast.exceptions.NoConnectionException;
import com.google.android.libraries.cast.companionlibrary.cast.exceptions.TransientNetworkDisconnectionException;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Charlie on 5/29/16.
 */

public class RNGoogleCastModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private VideoCastManager mCastManager;
    private VideoCastConsumer mCastConsumer;
    Map<String, MediaRouter.RouteInfo> currentDevices = new HashMap<>();
    private WritableMap deviceAvailableParams;


    @VisibleForTesting
    public static final String REACT_CLASS = "GoogleCastModule";

    private static final String DEVICE_AVAILABLE = "GoogleCast:DeviceAvailable";
    private static final String DEVICE_CONNECTED = "GoogleCast:DeviceConnected";
    private static final String DEVICE_DISCONNECTED = "GoogleCast:DeviceDisconnected";
    private static final String MEDIA_LOADED = "GoogleCast:MediaLoaded";

    public RNGoogleCastModule(ReactApplicationContext reactContext) {
        super(reactContext);
        getReactApplicationContext().addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "RNGoogleCast";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("DEVICE_AVAILABLE", DEVICE_AVAILABLE);
        constants.put("DEVICE_CONNECTED", DEVICE_CONNECTED);
        constants.put("DEVICE_DISCONNECTED", DEVICE_DISCONNECTED);
        constants.put("MEDIA_LOADED", MEDIA_LOADED);
        return constants;
    }

    private void emitMessageToRN(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private void addDevice(MediaRouter.RouteInfo info) {
        currentDevices.put(info.getId(), info);
    }

    private void removeDevice(MediaRouter.RouteInfo info) {
        currentDevices.remove(info.getId());
    }

    @ReactMethod
    public void stopScan() {
        Log.e(REACT_CLASS, "Stopping Scan");
        if (mCastManager != null) {
            mCastManager.decrementUiCounter();
        }
    }

    @ReactMethod
    public void getDevices(Promise promise) {
        WritableArray devicesList = Arguments.createArray();
        WritableMap singleDevice = Arguments.createMap();
        try {
            Log.e(REACT_CLASS, "devices size " + currentDevices.size());

            for (MediaRouter.RouteInfo existingChromecasts : currentDevices.values()) {
                singleDevice.putString("id", existingChromecasts.getId());
                singleDevice.putString("name", existingChromecasts.getName());
                devicesList.pushMap(singleDevice);
            }
            promise.resolve(devicesList);
        } catch (IllegalViewOperationException e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void castMedia(String mediaUrl, String title, String imageUrl, @Nullable Integer seconds) {
        if (seconds == null) {
            seconds = 0;
        }
        Log.e(REACT_CLASS, "Casting media... ");
        MediaInfo mediaInfo = GoogleCastService.getMediaInfo(mediaUrl, title, imageUrl);
        try {
            mCastManager.loadMedia(mediaInfo, true, seconds * 1000);
        } catch (TransientNetworkDisconnectionException | NoConnectionException e) {
            Log.e(REACT_CLASS, "falle ");
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void isConnected(Promise promise) {
        boolean isConnected = VideoCastManager.getInstance().isConnected();
        Log.e(REACT_CLASS, "Am I connected ? " + isConnected);
        promise.resolve(isConnected);
    }

    @ReactMethod
    public void connectToDevice(@Nullable String deviceId) {
        Log.e(REACT_CLASS, "received deviceName " + deviceId);
        try {
            Log.e(REACT_CLASS, "devices size " + currentDevices.size());
            MediaRouter.RouteInfo info = currentDevices.get(deviceId);
            CastDevice device = CastDevice.getFromBundle(info.getExtras());
            mCastManager.onDeviceSelected(device, info);
        } catch (IllegalViewOperationException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void disconnect() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    mCastManager.stopApplication();
                    mCastManager.disconnect();
                } catch (TransientNetworkDisconnectionException | NoConnectionException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void togglePauseCast() {
        try {
            if (mCastManager.isRemoteMediaPaused()) {
                mCastManager.play();
            } else {
                mCastManager.pause();
            }
        } catch (CastException | TransientNetworkDisconnectionException | NoConnectionException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void seekCast(int seconds) {
        try {
            //mCastManager receives milliseconds
            mCastManager.seek(seconds * 1000);
        } catch (TransientNetworkDisconnectionException | NoConnectionException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void getStreamPosition(Promise promise) {
        try {
            //Returns the current (approximate) position of the current media, in milliseconds.
            long time = mCastManager.getCurrentMediaPosition();
            //Our react native approach handles everything in seconds
            int seconds = (int) (time / 1000);
            promise.resolve(seconds);
        } catch (TransientNetworkDisconnectionException | NoConnectionException e) {
            e.printStackTrace();
        }
    }


    @ReactMethod
    public void startScan(@Nullable String appId) {
        Log.e(REACT_CLASS, "start scan Chromecast ");
        if (mCastManager != null) {
            mCastManager = VideoCastManager.getInstance();
            UiThreadUtil.runOnUiThread(new Runnable() {
                public void run() {
                    mCastManager.incrementUiCounter();
                    mCastManager.startCastDiscovery();
                }
            });

            Log.e(REACT_CLASS, "Chromecast Initialized by getting instance");
        } else {
            final CastConfiguration options = GoogleCastService.getCastConfig(appId);
            UiThreadUtil.runOnUiThread(new Runnable() {
                public void run() {
                    VideoCastManager.initialize(getCurrentActivity(), options);
                    mCastManager = VideoCastManager.getInstance();
                    mCastConsumer = new VideoCastConsumerImpl() {

                        @Override
                        public void onMediaLoadResult(int statusCode) {
                            super.onMediaLoadResult(statusCode);
                            emitMessageToRN(getReactApplicationContext(), MEDIA_LOADED, null);
                        }

                        @Override
                        public void onApplicationConnected(ApplicationMetadata appMetadata, String sessionId, boolean wasLaunched) {
                            super.onApplicationConnected(appMetadata, sessionId, wasLaunched);
                            Log.e(REACT_CLASS, "I am connected dudeeeeee ");
                            emitMessageToRN(getReactApplicationContext(), DEVICE_CONNECTED, null);
                        }

                        @Override
                        public void onDisconnected() {
                            super.onDisconnected();
                            Log.e(REACT_CLASS, "Device Disconnected");
                            emitMessageToRN(getReactApplicationContext(), DEVICE_DISCONNECTED, null);
                        }

                        @Override
                        public void onRouteRemoved(MediaRouter.RouteInfo info) {
                            super.onRouteRemoved(info);
                            removeDevice(info);
                        }

                        @Override
                        public void onCastDeviceDetected(MediaRouter.RouteInfo info) {
                            super.onCastDeviceDetected(info);
                            deviceAvailableParams = Arguments.createMap();
                            Log.e(REACT_CLASS, "detecting devices " + info.getName());
                            deviceAvailableParams.putBoolean("device_available", true);
                            emitMessageToRN(getReactApplicationContext(), DEVICE_AVAILABLE, deviceAvailableParams);
                            addDevice(info);
                        }

                        @Override
                        public void onApplicationConnectionFailed(int errorCode) {
                            Log.e(REACT_CLASS, "I failed :( with error code ");
                        }

                        @Override
                        public void onFailed(int resourceId, int statusCode) {
                            Log.e(REACT_CLASS, "I failed :( " + statusCode);
                        }

                        @Override
                        public void onCastAvailabilityChanged(boolean castPresent) {
                            deviceAvailableParams = Arguments.createMap();
                            Log.e(REACT_CLASS, "onCastAvailabilityChanged: exists? " + Boolean.toString(castPresent));
                            deviceAvailableParams.putBoolean("device_available", castPresent);
                            emitMessageToRN(getReactApplicationContext(), DEVICE_AVAILABLE, deviceAvailableParams);
                        }

                    };
                    mCastManager.addVideoCastConsumer(mCastConsumer);
                    mCastManager.incrementUiCounter();
                    mCastManager.startCastDiscovery();
                    Log.e(REACT_CLASS, "Chromecast Initialized for the first time!");
                }
            });
        }
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {

    }
}

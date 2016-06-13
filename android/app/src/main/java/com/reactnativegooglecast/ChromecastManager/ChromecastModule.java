package com.reactnativegooglecast.ChromecastManager;

import android.app.Activity;
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
import com.google.android.libraries.cast.companionlibrary.cast.exceptions.NoConnectionException;
import com.google.android.libraries.cast.companionlibrary.cast.exceptions.TransientNetworkDisconnectionException;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Charlie on 5/29/16.
 */
public class ChromecastModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private Activity mCurrentActivity;
    private VideoCastManager mCastManager;
    private VideoCastConsumer mCastConsumer;
    Map<String, MediaRouter.RouteInfo> currentDevices = new HashMap<>();
    private WritableMap deviceAvailableParams = Arguments.createMap();


    @VisibleForTesting
    public static final String REACT_CLASS = "ChromecastModule";

    private static final String DEVICE_CHANGED = "GoogleCast:DeviceListChanged";
    private static final String DEVICE_AVAILABLE = "GoogleCast:DeviceAvailable";
    private static final String DEVICE_CONNECTED = "GoogleCast:DeviceConnected";

    public ChromecastModule(ReactApplicationContext reactContext, Activity activity) {
        super(reactContext);
        getReactApplicationContext().addLifecycleEventListener(this);
        mCurrentActivity = activity;
    }

    @Override
    public String getName() {
        return "ChromecastManager";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(DEVICE_CHANGED, DEVICE_CHANGED);
        return constants;
    }

//    RCT_EXTERN_METHOD(startScan)
//    RCT_EXTERN_METHOD(stopScan)
//
//    RCT_EXTERN_METHOD(connectToDevice: (NSString *) deviceName)
//    RCT_EXTERN_METHOD(disconnect)
//
//    RCT_EXTERN_METHOD(castVideo: (NSString *) videoUrl title: (NSString *) title description: (NSString *) description imageUrl: (NSString *) imageUrl)
//
//    RCT_EXTERN_METHOD(play)
//    RCT_EXTERN_METHOD(pause)
//
//    RCT_EXTERN_METHOD(getStreamPosition: (RCTResponseSenderBlock *) successCallback)

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
    public void castMedia(String mediaUrl, String title, String description, String imageUrl) {
        Log.e(REACT_CLASS, "Casting media... ");
        MediaInfo mediaInfo = ChromecastService.getMediaInfo("http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", "A video");
        //MediaInfo mediaInfo = ChromecastService.getMediaInfo(mediaUrl, title);
        try {
            mCastManager.loadMedia(mediaInfo, true, 0);
        } catch (TransientNetworkDisconnectionException | NoConnectionException e) {
            Log.e(REACT_CLASS, "falle ");
            e.printStackTrace();
        }
    }

    @ReactMethod
    public boolean isConnected() {
        return VideoCastManager.getInstance().isConnected();
    }

    @ReactMethod
    public void connectToDevice(String deviceId) {
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
    public void startScan() {
        Log.e(REACT_CLASS, "start scanning... ");
        final CastConfiguration options = ChromecastService.getCastConfig();
        UiThreadUtil.runOnUiThread(new Runnable() {
            public void run() {
                VideoCastManager.initialize(getCurrentActivity(), options);
                mCastManager = VideoCastManager.getInstance();

                mCastConsumer = new VideoCastConsumerImpl() {
                    @Override
                    public void onApplicationConnected(ApplicationMetadata appMetadata, String sessionId, boolean wasLaunched) {
                        super.onApplicationConnected(appMetadata, sessionId, wasLaunched);
                        Log.e(REACT_CLASS, "I am connected dudeeeeee ");
                        emitMessageToRN(getReactApplicationContext(), DEVICE_CONNECTED, null);
                    }

                    @Override
                    public void onRouteRemoved(MediaRouter.RouteInfo info) {
                        super.onRouteRemoved(info);
                        removeDevice(info);
                    }

                    @Override
                    public void onCastDeviceDetected(MediaRouter.RouteInfo info) {
                        super.onCastDeviceDetected(info);
                        Log.e(REACT_CLASS, info.getName());
                        addDevice(info);
                    }

                    @Override
                    public void onApplicationConnectionFailed(int errorCode) {
                        Log.e(REACT_CLASS, "I failed :( with error code ");
                    }

                    @Override
                    public void onFailed(int resourceId, int statusCode) {
                        Log.e(REACT_CLASS, "I failed :(");
                    }

                    @Override
                    public void onCastAvailabilityChanged(boolean castPresent) {
                        Log.e(REACT_CLASS, "onCastAvailabilityChanged: exists? " + Boolean.toString(castPresent));
                        deviceAvailableParams.putBoolean("device_available", castPresent);
                        emitMessageToRN(getReactApplicationContext(), DEVICE_AVAILABLE, deviceAvailableParams);
                    }

                };
                mCastManager.addVideoCastConsumer(mCastConsumer);
            }
        });
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

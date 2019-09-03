package com.reactnative.googlecast.types;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.common.images.WebImage;

import java.util.ArrayList;
import java.util.List;

public class RNGCDevice {
  public static WritableMap toJson(final CastDevice device) {
    final WritableMap json = new WritableNativeMap();

    json.putString("deviceId", device.getDeviceId());

    json.putString("deviceVersion", device.getDeviceVersion());

    json.putString("friendlyName", device.getFriendlyName());

    WritableArray icons = Arguments.createArray();
    for (WebImage image : device.getIcons()) {
      icons.pushMap(RNGCWebImage.toJson(image));
    }
    json.putArray("icons", icons);

    json.putString("ipAddress", device.getInetAddress().toString());

    json.putBoolean("isOnLocalNetwork", device.isOnLocalNetwork());

    json.putString("modelName", device.getModelName());

    return json;
  }
}

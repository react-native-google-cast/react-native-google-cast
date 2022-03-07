package com.reactnative.googlecast.types;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.common.images.WebImage;

import javax.annotation.Nullable;

public class RNGCDevice {
  public static @Nullable WritableMap toJson(final @Nullable CastDevice device) {
    if (device == null) return null;

    final WritableMap json = new WritableNativeMap();

    final WritableArray capabilities = new WritableNativeArray();
    if (device.hasCapability(CastDevice.CAPABILITY_AUDIO_IN)) {
      capabilities.pushString("AudioIn");
    }
    if (device.hasCapability(CastDevice.CAPABILITY_AUDIO_OUT)) {
      capabilities.pushString("AudioOut");
    }
    if (device.hasCapability(CastDevice.CAPABILITY_VIDEO_IN)) {
      capabilities.pushString("VideoIn");
    }
    if (device.hasCapability(CastDevice.CAPABILITY_VIDEO_OUT)) {
      capabilities.pushString("VideoOut");
    }
    if (device.hasCapability(CastDevice.CAPABILITY_MULTIZONE_GROUP)) {
      capabilities.pushString("MultizoneGroup");
    }
    json.putArray("capabilities", capabilities);

    json.putString("deviceId", device.getDeviceId());

    json.putString("deviceVersion", device.getDeviceVersion());

    json.putString("friendlyName", device.getFriendlyName());

    WritableArray icons = Arguments.createArray();
    if (device.getIcons() != null) {
      for (WebImage image : device.getIcons()) {
        icons.pushMap(RNGCWebImage.toJson(image));
      }
    }
    json.putArray("icons", icons);

    json.putString("ipAddress", device.getInetAddress().toString());

    json.putBoolean("isOnLocalNetwork", device.isOnLocalNetwork());

    json.putString("modelName", device.getModelName());


    return json;
  }
}

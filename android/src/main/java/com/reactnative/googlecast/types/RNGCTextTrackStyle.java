package com.reactnative.googlecast.types;

import android.graphics.Color;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.TextTrackStyle;

import org.json.JSONObject;
import org.w3c.dom.Text;

public class RNGCTextTrackStyle {
  public static @Nullable TextTrackStyle fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    TextTrackStyle style = new TextTrackStyle();

    if (json.hasKey("backgroundColor")) {
      style.setBackgroundColor(
          RNGCColor.fromJson(json.getString("backgroundColor")));
    }

    if (json.hasKey("customData")) {
      style.setCustomData(RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("edgeColor")) {
      style.setEdgeColor(RNGCColor.fromJson(json.getString("edgeColor")));
    }

    if (json.hasKey("edgeType")) {
      style.setEdgeType(
          RNGCTextTrackStyleEdgeType.fromJson(json.getString("edgeType")));
    }

    if (json.hasKey("fontFamily")) {
      style.setFontFamily(json.getString("fontFamily"));
    }

    if (json.hasKey("fontGenericFamily")) {
      style.setFontGenericFamily(RNGCTextTrackStyleFontGenericFamily.fromJson(
          json.getString("fontGenericFamily")));
    }

    if (json.hasKey("fontScale")) {
      style.setFontScale((float)json.getDouble("fontScale"));
    }

    if (json.hasKey("foregroundColor")) {
      style.setForegroundColor(
          RNGCColor.fromJson(json.getString("foregroundColor")));
    }

    if (json.hasKey("windowColor")) {
      style.setWindowColor(RNGCColor.fromJson(json.getString("windowColor")));
    }

    if (json.hasKey("windowCornerRadius")) {
      style.setWindowCornerRadius(json.getInt("windowCornerRadius"));
    }

    if (json.hasKey("windowType")) {
      style.setWindowType(
          RNGCTextTrackStyleWindowType.fromJson(json.getString("windowType")));
    }

    return style;
  }

  public static @Nullable WritableMap toJson(final @Nullable TextTrackStyle style) {
    if (style == null) return null;

    final WritableMap json = new WritableNativeMap();

    json.putString("backgroundColor",
                   RNGCColor.toJson(style.getBackgroundColor()));

    json.putMap("customData", RNGCJSONObject.toJson(style.getCustomData()));

    json.putString("edgeColor", RNGCColor.toJson(style.getEdgeColor()));

    json.putString("edgeType",
                   RNGCTextTrackStyleEdgeType.toJson(style.getEdgeType()));

    json.putString("fontFamily", style.getFontFamily());

    json.putString("fontGenericFamily",
                   RNGCTextTrackStyleFontGenericFamily.toJson(
                       (style.getFontGenericFamily())));

    json.putDouble("fontScale", style.getFontScale());

    json.putString("foregroundColor",
                   RNGCColor.toJson(style.getForegroundColor()));

    json.putString("windowColor", RNGCColor.toJson(style.getWindowColor()));

    json.putInt("windowCornerRadius", style.getWindowCornerRadius());

    json.putString("windowType",
                   RNGCTextTrackStyleWindowType.toJson(style.getWindowType()));

    return json;
  }
}

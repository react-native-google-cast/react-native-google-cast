package com.reactnative.googlecast;

import android.graphics.Color;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;

public class ReadableMapUtils {
    public static @Nullable String getString(@NonNull ReadableMap map, @NonNull String key) {
        if (!map.hasKey(key)) {
            return null;
        }

        return map.getString(key);
    }

    public static @Nullable ReadableMap getReadableMap(@NonNull ReadableMap map, @NonNull String key) {
        if (!map.hasKey(key)) {
            return null;
        }

        return map.getMap(key);
    }

    public static @Nullable ReadableArray getReadableArray(@NonNull ReadableMap map, @NonNull String key){
        if(!map.hasKey(key)){
            return null;
        }

        return map.getArray(key);
    }

    public static @Nullable Map<?, ?> getMap(@NonNull ReadableMap map, @NonNull String key) {
        ReadableMap innerMap = getReadableMap(map, key);
        if (innerMap == null) {
            return null;
        }

        return innerMap.toHashMap();
    }

    public static @Nullable Integer getInt(@NonNull ReadableMap map, @NonNull String key) {
        if (!map.hasKey(key)) {
            return null;
        }

        return map.getInt(key);
    }

    public static @Nullable Double getDouble(@NonNull ReadableMap map, @NonNull String key) {
        if (!map.hasKey(key)) {
            return null;
        }

        return map.getDouble(key);
    }

    public static @Nullable Float getFloat(@NonNull ReadableMap map, @NonNull String key) {
        Double value = getDouble(map, key);
        return value == null ? null : value.floatValue();
    }

    public static @Nullable Boolean getBoolean(@NonNull ReadableMap map, @NonNull String key) {
        if (!map.hasKey(key)) {
            return null;
        }

        return map.getBoolean(key);
    }

    public static @Nullable Integer getColor(@NonNull ReadableMap map, @NonNull String key) {
        String colorString = getString(map, key);
        if (colorString == null) {
            return null;
        }

        return Color.parseColor(colorString);
    }
}

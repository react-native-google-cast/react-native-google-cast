package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.VideoInfo;

public class RNGCVideoInfoHDRType {
  public static @Nullable String toJson(final int value) {
    switch (value) {
    case VideoInfo.HDR_TYPE_DV:
      return "DV";
    case VideoInfo.HDR_TYPE_HDR:
    case VideoInfo.HDR_TYPE_HDR10:
      return "HDR";
    case VideoInfo.HDR_TYPE_SDR:
      return "SDR";
    default:
      return null;
    }
  }
}

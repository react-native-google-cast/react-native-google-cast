package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaTrack;

import java.util.ArrayList;
import java.util.List;

public class RNGCMediaInfo {
  public static @Nullable MediaInfo fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    String contentId = json.hasKey("contentId")
      ? json.getString("contentId")
      : json.getString("contentUrl");

    final MediaInfo.Builder builder = new MediaInfo.Builder(contentId);

//    if (json.hasKey("adBreakClips")) {
//      builder.setContentType(json.getString("adBreakClips"));
//    }

//    if (json.hasKey("adBreaks")) {
//      builder.setContentType(json.getString("adBreaks"));
//    }

    if (json.hasKey("contentType")) {
      builder.setContentType(json.getString("contentType"));
    }

    if (json.hasKey("contentUrl")) {
      builder.setContentUrl(json.getString("contentUrl"));
    }

    if (json.hasKey("customData")) {
      builder.setCustomData(
        RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("hlsSegmentFormat")) {
      builder.setHlsSegmentFormat(RNGCHlsSegmentFormat.fromJson(json.getString("hlsSegmentFormat")));
    }

    if (json.hasKey("hlsVideoSegmentFormat")) {
      builder.setHlsVideoSegmentFormat(RNGCHlsVideoSegmentFormat.fromJson(json.getString("hlsVideoSegmentFormat")));
    }

    if (json.hasKey("entity")) {
      builder.setEntity(json.getString(("entity")));
    }

    if (json.hasKey("mediaTracks")) {
      final List<MediaTrack> mediaTracks = new ArrayList<MediaTrack>();
      ReadableArray tracksArray = json.getArray("mediaTracks");
      for (int i = 0; i < tracksArray.size(); i++) {
        mediaTracks.add(RNGCMediaTrack.fromJson(tracksArray.getMap(i)));
      }
      builder.setMediaTracks(mediaTracks);
    }

    if (json.hasKey("metadata")) {
      builder.setMetadata(RNGCMediaMetadata.fromJson(json.getMap("metadata")));
    }

    if (json.hasKey("streamDuration")) {
      builder.setStreamDuration(Math.round(json.getDouble("streamDuration") * 1000));
    }

    if (json.hasKey("streamType")) {
      builder.setStreamType(RNGCMediaStreamType.fromJson(json.getString("streamType")));
    }

    if (json.hasKey("textTrackStyle")) {
      builder.setTextTrackStyle(RNGCTextTrackStyle.fromJson(json.getMap("textTrackStyle")));
    }

    // if (json.hasKey("vmapAdsRequest")) {
    //   builder.setEntity(json.getString(("vmapAdsRequest")));
    // }

    return builder.build();
  }

  public static @Nullable WritableMap toJson(final @Nullable MediaInfo info) {
    if (info == null) return null;

    final WritableMap json = new WritableNativeMap();

    // adBreakClips

    // adBreaks

    json.putString("contentId", info.getContentId());

    json.putString("contentType", info.getContentType());

    json.putString("contentUrl", info.getContentUrl());

    json.putMap("customData", RNGCJSONObject.toJson(info.getCustomData()));

    json.putString("hlsSegmentFormat", RNGCHlsSegmentFormat.toJson(info.getHlsSegmentFormat()));

    json.putString("hlsVideoSegmentFormat", RNGCHlsVideoSegmentFormat.toJson(info.getHlsVideoSegmentFormat()));

    json.putString("entity", info.getEntity());

    WritableArray mediaTracks = Arguments.createArray();
    if (info.getMediaTracks() != null) {
      for (MediaTrack track : info.getMediaTracks()) {
        mediaTracks.pushMap(RNGCMediaTrack.toJson(track));
      }
    }
    json.putArray("mediaTracks", mediaTracks);

    json.putMap("metadata", RNGCMediaMetadata.toJson(info.getMetadata()));

    if (info.getStreamDuration() != MediaInfo.UNKNOWN_DURATION) {
      json.putDouble("streamDuration", info.getStreamDuration() / 1000.0);
    }

    json.putString("streamType", RNGCMediaStreamType.toJson(info.getStreamType()));

    json.putMap("textTrackStyle", RNGCTextTrackStyle.toJson(info.getTextTrackStyle()));

    // vmapAdsRequest

    return json;
  }
}

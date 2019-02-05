package com.reactnative.googlecast.api.convert;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaTrack;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class RNGCMediaInfo {
  public static MediaInfo fromJson(final ReadableMap json) {
    final MediaInfo.Builder builder =
        new MediaInfo.Builder(json.getString("contentId"));

//    if (json.hasKey("adBreakClips")) {
//      builder.setContentType(json.getString("adBreakClips"));
//    }

//    if (json.hasKey("adBreaks")) {
//      builder.setContentType(json.getString("adBreaks"));
//    }

    if (json.hasKey("contentType")) {
      builder.setContentType(json.getString("contentType"));
    }

    if (json.hasKey("customData")) {
      builder.setCustomData(
          RNGCJSONObject.fromJson(json.getMap("customData")));
    }

    if (json.hasKey("entity")) {
      builder.setEntity(json.getString(("entity")));
    }

    if (json.hasKey("mediaTracks")) {
      final List<MediaTrack> mediaTracks = new ArrayList<MediaTrack>();
      for (Object mediaTrack:
           json.getArray("mediaTracks").toArrayList()) {
        mediaTracks.add(RNGCMediaTrack.fromJson((ReadableMap)mediaTrack));
      }
      builder.setMediaTracks(mediaTracks);
    }

    if (json.hasKey("metadata")) {
      builder.setMetadata(RNGCMediaMetadata.fromJson(json.getMap("metadata")));
    }

    if (json.hasKey("streamDuration")) {
      builder.setStreamDuration(json.getInt("streamDuration"));
    }

    if (json.hasKey("streamType")) {
      builder.setStreamType(RNGCMediaStreamType.fromJson(json.getString("streamType")));
    }

//    if (json.hasKey("textTrackStyle")) {
//      builder.setEntity(json.getString(("textTrackStyle")));
//    }

    // if (json.hasKey("vmapAdsRequest")) {
    //   builder.setEntity(json.getString(("vmapAdsRequest")));
    // }

    return builder.build();
  }

  public static WritableMap toJson(final MediaInfo info) {
    final WritableMap json = new WritableNativeMap();

    // adBreakClips

    // adBreaks

    json.putString("contentId", info.getContentId());

    json.putString("contentType", info.getContentType());

    json.putMap("customData", RNGCJSONObject.toJson(info.getCustomData()));

    json.putString("entity", info.getEntity());

    WritableArray mediaTracks = Arguments.createArray();
    for (MediaTrack track: info.getMediaTracks()) {
      mediaTracks.pushMap(RNGCMediaTrack.toJson(track));
    }
    json.putArray("mediaTracks", mediaTracks);

    json.putMap("metadata", RNGCMediaMetadata.toJson(info.getMetadata()));

    json.putInt("streamDuration", (int) info.getStreamDuration());

    json.putString("streamType", RNGCMediaStreamType.toJson(info.getStreamType()));

    // testTrackStyle

    // vmapAdsRequest

    return json;
  }
}

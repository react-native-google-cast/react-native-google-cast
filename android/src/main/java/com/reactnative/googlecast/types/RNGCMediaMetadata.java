package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.common.images.WebImage;

public class RNGCMediaMetadata {
  public static @Nullable
  MediaMetadata fromJson(final @Nullable ReadableMap json) {
    if (json == null) return null;

    MediaMetadata metadata;

    if (json.hasKey("type")) {
      metadata = new MediaMetadata(
        RNGCMediaMetadataType.fromJson(json.getString("type")));
    } else {
      metadata = new MediaMetadata();
    }

    if (json.hasKey("creationDate")) {
      metadata.putDate(MediaMetadata.KEY_CREATION_DATE,
        RNGCCalendar.fromJson(json.getString("creationDate")));
    }
    if (json.hasKey("releaseDate")) {
      metadata.putDate(MediaMetadata.KEY_RELEASE_DATE,
        RNGCCalendar.fromJson(json.getString("releaseDate")));
    }
    if (json.hasKey("broadcastDate")) {
      metadata.putDate(MediaMetadata.KEY_BROADCAST_DATE,
        RNGCCalendar.fromJson(json.getString("broadcastDate")));
    }
    if (json.hasKey("title")) {
      metadata.putString(MediaMetadata.KEY_TITLE, json.getString("title"));
    }
    if (json.hasKey("subtitle")) {
      metadata.putString(MediaMetadata.KEY_SUBTITLE,
        json.getString("subtitle"));
    }
    if (json.hasKey("artist")) {
      metadata.putString(MediaMetadata.KEY_ARTIST, json.getString("artist"));
    }
    if (json.hasKey("albumArtist")) {
      metadata.putString(MediaMetadata.KEY_ALBUM_ARTIST,
        json.getString("albumArtist"));
    }
    if (json.hasKey("albumTitle")) {
      metadata.putString(MediaMetadata.KEY_ALBUM_TITLE,
        json.getString("albumTitle"));
    }
    if (json.hasKey("composer")) {
      metadata.putString(MediaMetadata.KEY_COMPOSER,
        json.getString("composer"));
    }
    if (json.hasKey("discNumber")) {
      metadata.putInt(MediaMetadata.KEY_DISC_NUMBER, json.getInt("discNumber"));
    }
    if (json.hasKey("trackNumber")) {
      metadata.putInt(MediaMetadata.KEY_TRACK_NUMBER,
        json.getInt("trackNumber"));
    }
    if (json.hasKey("seasonNumber")) {
      metadata.putInt(MediaMetadata.KEY_SEASON_NUMBER,
        json.getInt("seasonNumber"));
    }
    if (json.hasKey("episodeNumber")) {
      metadata.putInt(MediaMetadata.KEY_EPISODE_NUMBER,
        json.getInt("episodeNumber"));
    }
    if (json.hasKey("seriesTitle")) {
      metadata.putString(MediaMetadata.KEY_SERIES_TITLE,
        json.getString("seriesTitle"));
    }
    if (json.hasKey("studio")) {
      metadata.putString(MediaMetadata.KEY_STUDIO, json.getString("studio"));
    }
    if (json.hasKey("width")) {
      metadata.putInt(MediaMetadata.KEY_WIDTH, json.getInt("width"));
    }
    if (json.hasKey("height")) {
      metadata.putInt(MediaMetadata.KEY_HEIGHT, json.getInt("height"));
    }
    if (json.hasKey("location")) {
      metadata.putString(MediaMetadata.KEY_LOCATION_NAME,
        json.getString("location"));
    }
    if (json.hasKey("latitude")) {
      metadata.putDouble(MediaMetadata.KEY_LOCATION_LATITUDE,
        json.getDouble("latitude"));
    }
    if (json.hasKey("longitude")) {
      metadata.putDouble(MediaMetadata.KEY_LOCATION_LONGITUDE,
        json.getDouble("longitude"));
    }
    if (json.hasKey("images")) {
      ReadableArray imagesArray = json.getArray("images");
      for (int i = 0; i < imagesArray.size(); i++) {
        metadata.addImage(RNGCWebImage.fromJson(imagesArray.getMap(i)));
      }
    }

    return metadata;
  }

  public static @Nullable
  WritableMap toJson(final @Nullable MediaMetadata metadata) {
    if (metadata == null) return null;

    final WritableMap json = Arguments.createMap();

    json.putString("type", RNGCMediaMetadataType.toJson(
      metadata.getMediaType()));

    final WritableArray images = Arguments.createArray();
    if (metadata.getImages() != null) {
      for (WebImage image : metadata.getImages()) {
        images.pushMap(RNGCWebImage.toJson(image));
      }
    }
    json.putArray("images", images);

    switch (metadata.getMediaType()) {
      case MediaMetadata.MEDIA_TYPE_GENERIC:
        json.putString("artist", metadata.getString(MediaMetadata.KEY_ARTIST));
        json.putString("releaseDate",
          RNGCCalendar.toJson(metadata.getDate(MediaMetadata.KEY_RELEASE_DATE)));
        json.putString("subtitle",
          metadata.getString(MediaMetadata.KEY_SUBTITLE));
        json.putString("title", metadata.getString(MediaMetadata.KEY_TITLE));
        break;
      case MediaMetadata.MEDIA_TYPE_MOVIE:
        json.putString("releaseDate",
          RNGCCalendar.toJson(metadata.getDate(MediaMetadata.KEY_RELEASE_DATE)));
        json.putString("studio", metadata.getString(MediaMetadata.KEY_STUDIO));
        json.putString("subtitle",
          metadata.getString(MediaMetadata.KEY_SUBTITLE));
        json.putString("title", metadata.getString(MediaMetadata.KEY_TITLE));
        break;
      case MediaMetadata.MEDIA_TYPE_MUSIC_TRACK:
        json.putString("albumArtist",
          metadata.getString(MediaMetadata.KEY_ALBUM_ARTIST));
        json.putString("albumTitle",
          metadata.getString(MediaMetadata.KEY_ALBUM_TITLE));
        json.putString("artist", metadata.getString(MediaMetadata.KEY_ARTIST));
        json.putString("composer",
          metadata.getString(MediaMetadata.KEY_COMPOSER));
        json.putInt("discNumber", metadata.getInt(MediaMetadata.KEY_DISC_NUMBER));
        json.putString("releaseDate",
          RNGCCalendar.toJson(metadata.getDate(MediaMetadata.KEY_RELEASE_DATE)));
        json.putString("title", metadata.getString(MediaMetadata.KEY_TITLE));
        json.putInt("trackNumber",
          metadata.getInt(MediaMetadata.KEY_TRACK_NUMBER));
        break;
      case MediaMetadata.MEDIA_TYPE_PHOTO:
        json.putString("artist", metadata.getString(MediaMetadata.KEY_ARTIST));
        json.putString("creationDate",
          RNGCCalendar.toJson(metadata.getDate(MediaMetadata.KEY_CREATION_DATE)));
        json.putInt("height", metadata.getInt(MediaMetadata.KEY_HEIGHT));
        json.putDouble("latitude",
          metadata.getDouble(MediaMetadata.KEY_LOCATION_LATITUDE));
        json.putString("location",
          metadata.getString(MediaMetadata.KEY_LOCATION_NAME));
        json.putDouble("longitude",
          metadata.getDouble(MediaMetadata.KEY_LOCATION_LONGITUDE));
        json.putString("title", metadata.getString(MediaMetadata.KEY_TITLE));
        json.putInt("width", metadata.getInt(MediaMetadata.KEY_WIDTH));
        break;
      case MediaMetadata.MEDIA_TYPE_TV_SHOW:
        json.putString("broadcastDate", RNGCCalendar.toJson(metadata.getDate(
          MediaMetadata.KEY_BROADCAST_DATE)));
        json.putString("releaseDate",
          RNGCCalendar.toJson(metadata.getDate(MediaMetadata.KEY_RELEASE_DATE)));
        json.putInt("seasonNumber",
          metadata.getInt(MediaMetadata.KEY_SEASON_NUMBER));
        json.putString("seriesTitle",
          metadata.getString(MediaMetadata.KEY_SERIES_TITLE));
        json.putString("title", metadata.getString(MediaMetadata.KEY_TITLE));
        break;
    }

    return json;
  }
}

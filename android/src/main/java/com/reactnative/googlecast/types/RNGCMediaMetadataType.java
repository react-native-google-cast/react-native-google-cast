package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaMetadata;

public class RNGCMediaMetadataType {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
    case "generic":
      return MediaMetadata.MEDIA_TYPE_GENERIC;
    case "movie":
      return MediaMetadata.MEDIA_TYPE_MOVIE;
    case "musicTrack":
      return MediaMetadata.MEDIA_TYPE_MUSIC_TRACK;
    case "photo":
      return MediaMetadata.MEDIA_TYPE_PHOTO;
    case "tvShow":
      return MediaMetadata.MEDIA_TYPE_TV_SHOW;
    default:
      return MediaMetadata.MEDIA_TYPE_USER;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
    case MediaMetadata.MEDIA_TYPE_GENERIC:
      return "generic";
    case MediaMetadata.MEDIA_TYPE_MOVIE:
      return "movie";
    case MediaMetadata.MEDIA_TYPE_MUSIC_TRACK:
      return "musicTrack";
    case MediaMetadata.MEDIA_TYPE_PHOTO:
      return "photo";
    case MediaMetadata.MEDIA_TYPE_TV_SHOW:
      return "tvShow";
    default:
      return null;
    }
  }
}

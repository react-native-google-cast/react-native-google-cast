package com.reactnative.googlecast.api.convert;

import com.google.android.gms.cast.MediaMetadata;

public class RNGCMediaMetadataType {
  public static int fromJson(final String value) {
    switch (value) {
    case "Generic":
      return MediaMetadata.MEDIA_TYPE_GENERIC;
    case "Movie":
      return MediaMetadata.MEDIA_TYPE_MOVIE;
    case "MusicTrack":
      return MediaMetadata.MEDIA_TYPE_MUSIC_TRACK;
    case "Photo":
      return MediaMetadata.MEDIA_TYPE_PHOTO;
    case "TvShow":
      return MediaMetadata.MEDIA_TYPE_TV_SHOW;
    default:
      return MediaMetadata.MEDIA_TYPE_USER;
    }
  }

  public static String toJson(final int value) {
    switch (value) {
    case MediaMetadata.MEDIA_TYPE_GENERIC:
      return "Generic";
    case MediaMetadata.MEDIA_TYPE_MOVIE:
      return "Movie";
    case MediaMetadata.MEDIA_TYPE_MUSIC_TRACK:
      return "MusicTrack";
    case MediaMetadata.MEDIA_TYPE_PHOTO:
      return "Photo";
    case MediaMetadata.MEDIA_TYPE_TV_SHOW:
      return "TvShow";
    default:
      return null;
    }
  }
}

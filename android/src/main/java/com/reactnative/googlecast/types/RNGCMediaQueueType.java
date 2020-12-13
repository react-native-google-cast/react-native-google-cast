package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import com.google.android.gms.cast.MediaQueueData;
import com.google.android.gms.cast.MediaStatus;

public class RNGCMediaQueueType {
  public static int fromJson(final @Nullable String value) {
    switch (value) {
      case "album":
        return MediaQueueData.MEDIA_QUEUE_TYPE_ALBUM;
      case "audioBook":
        return MediaQueueData.MEDIA_QUEUE_TYPE_AUDIO_BOOK;
      case "liveTv":
        return MediaQueueData.MEDIA_QUEUE_TYPE_LIVE_TV;
      case "movie":
        return MediaQueueData.MEDIA_QUEUE_TYPE_MOVIE;
      case "playlist":
        return MediaQueueData.MEDIA_QUEUE_TYPE_PLAYLIST;
      case "radioStation":
        return MediaQueueData.MEDIA_QUEUE_TYPE_RADIO_STATION;
      case "podcastSeries":
        return MediaQueueData.MEDIA_QUEUE_TYPE_PODCAST_SERIES;
      case "tvSeries":
        return MediaQueueData.MEDIA_QUEUE_TYPE_TV_SERIES;
      case "videoPlaylist":
        return MediaQueueData.MEDIA_QUEUE_TYPE_VIDEO_PLAYLIST;
      default:
        return MediaQueueData.MEDIA_QUEUE_TYPE_GENERIC;
    }
  }

  public static @Nullable String toJson(final int value) {
    switch (value) {
      case MediaQueueData.MEDIA_QUEUE_TYPE_ALBUM:
        return "album";
      case MediaQueueData.MEDIA_QUEUE_TYPE_AUDIO_BOOK:
        return "audioBook";
      case MediaQueueData.MEDIA_QUEUE_TYPE_LIVE_TV:
        return "liveTv";
      case MediaQueueData.MEDIA_QUEUE_TYPE_MOVIE:
        return "movie";
      case MediaQueueData.MEDIA_QUEUE_TYPE_PLAYLIST:
        return "playlist";
      case MediaQueueData.MEDIA_QUEUE_TYPE_RADIO_STATION:
        return "radioStation";
      case MediaQueueData.MEDIA_QUEUE_TYPE_PODCAST_SERIES:
        return "podcastSeries";
      case MediaQueueData.MEDIA_QUEUE_TYPE_TV_SERIES:
        return "tvSeries";
      case MediaQueueData.MEDIA_QUEUE_TYPE_VIDEO_PLAYLIST:
        return "videoPlaylist";
      default:
        return null;
    }
  }
}

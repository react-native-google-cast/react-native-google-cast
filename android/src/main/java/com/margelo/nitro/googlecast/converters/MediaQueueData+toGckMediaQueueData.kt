package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueData
import com.margelo.nitro.googlecast.MediaQueueType
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.google.android.gms.cast.MediaQueueData as GckMediaQueueData
import com.google.android.gms.cast.MediaStatus as GckMediaStatus

/**
 * Converts a generated [MediaQueueData] struct into a Google Cast [GckMediaQueueData].
 *
 * The reverse lives in `GckMediaQueueData+toMediaQueueData.kt`. `type` and `repeatMode` are
 * mapped BY VALUE. `startTime` is seconds in the struct / milliseconds (`long`) in GCK.
 */
internal fun MediaQueueData.toGckMediaQueueData(): GckMediaQueueData {
  val builder = GckMediaQueueData.Builder()
  id?.let { builder.setQueueId(it) }
  name?.let { builder.setName(it) }
  entity?.let { builder.setEntity(it) }
  type?.let { builder.setQueueType(it.toGckQueueType()) }
  repeatMode?.let { builder.setRepeatMode(it.toGckRepeatMode()) }
  containerMetadata?.let { builder.setContainerMetadata(it.toGckMediaQueueContainerMetadata()) }
  items?.let { list -> builder.setItems(list.map { it.toGckMediaQueueItem() }) }
  startIndex?.let { builder.setStartIndex(it.toInt()) }
  startTime?.let { builder.setStartTime((it * 1000).toLong()) }
  return builder.build()
}

private fun MediaQueueType.toGckQueueType(): Int =
  when (this) {
    MediaQueueType.MOVIE -> GckMediaQueueData.MEDIA_QUEUE_TYPE_MOVIE
    MediaQueueType.AUDIOBOOK -> GckMediaQueueData.MEDIA_QUEUE_TYPE_AUDIO_BOOK
    MediaQueueType.ALBUM -> GckMediaQueueData.MEDIA_QUEUE_TYPE_ALBUM
    MediaQueueType.LIVETV -> GckMediaQueueData.MEDIA_QUEUE_TYPE_LIVE_TV
    MediaQueueType.PLAYLIST -> GckMediaQueueData.MEDIA_QUEUE_TYPE_PLAYLIST
    MediaQueueType.RADIOSTATION -> GckMediaQueueData.MEDIA_QUEUE_TYPE_RADIO_STATION
    MediaQueueType.PODCASTSERIES -> GckMediaQueueData.MEDIA_QUEUE_TYPE_PODCAST_SERIES
    MediaQueueType.TVSERIES -> GckMediaQueueData.MEDIA_QUEUE_TYPE_TV_SERIES
    MediaQueueType.VIDEOPLAYLIST -> GckMediaQueueData.MEDIA_QUEUE_TYPE_VIDEO_PLAYLIST
  }

private fun MediaRepeatMode.toGckRepeatMode(): Int =
  when (this) {
    MediaRepeatMode.ALL -> GckMediaStatus.REPEAT_MODE_REPEAT_ALL
    MediaRepeatMode.ALLANDSHUFFLE -> GckMediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE
    MediaRepeatMode.OFF -> GckMediaStatus.REPEAT_MODE_REPEAT_OFF
    MediaRepeatMode.SINGLE -> GckMediaStatus.REPEAT_MODE_REPEAT_SINGLE
  }

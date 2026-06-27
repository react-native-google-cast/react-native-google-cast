package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueData
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaQueueType
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.google.android.gms.cast.MediaQueueData as GckMediaQueueData
import com.google.android.gms.cast.MediaStatus as GckMediaStatus

/**
 * Converts a Google Cast [GckMediaQueueData] into a generated [MediaQueueData] struct.
 *
 * Reverse of `MediaQueueData+toGckMediaQueueData.kt`. `type` and `repeatMode` are mapped BY
 * VALUE; `MEDIA_QUEUE_TYPE_GENERIC` (which our union does not model) becomes `null`. GCK
 * milliseconds become seconds. Empty item lists normalize to `null`.
 */
internal fun GckMediaQueueData.toMediaQueueData(): MediaQueueData {
  val mappedItems = items?.map { it.toMediaQueueItem() }
  return MediaQueueData(
    id = queueId,
    name = name,
    entity = entity,
    type = queueTypeOrNull(queueType),
    repeatMode = repeatModeFromGck(repeatMode),
    containerMetadata = containerMetadata?.toMediaQueueContainerMetadata(),
    items = if (mappedItems.isNullOrEmpty()) null else mappedItems.toTypedArray<MediaQueueItem>(),
    startIndex = startIndex.toDouble(),
    startTime = startTime / 1000.0
  )
}

private fun queueTypeOrNull(value: Int): MediaQueueType? =
  when (value) {
    GckMediaQueueData.MEDIA_QUEUE_TYPE_MOVIE -> MediaQueueType.MOVIE
    GckMediaQueueData.MEDIA_QUEUE_TYPE_AUDIO_BOOK -> MediaQueueType.AUDIOBOOK
    GckMediaQueueData.MEDIA_QUEUE_TYPE_ALBUM -> MediaQueueType.ALBUM
    GckMediaQueueData.MEDIA_QUEUE_TYPE_LIVE_TV -> MediaQueueType.LIVETV
    GckMediaQueueData.MEDIA_QUEUE_TYPE_PLAYLIST -> MediaQueueType.PLAYLIST
    GckMediaQueueData.MEDIA_QUEUE_TYPE_RADIO_STATION -> MediaQueueType.RADIOSTATION
    GckMediaQueueData.MEDIA_QUEUE_TYPE_PODCAST_SERIES -> MediaQueueType.PODCASTSERIES
    GckMediaQueueData.MEDIA_QUEUE_TYPE_TV_SERIES -> MediaQueueType.TVSERIES
    GckMediaQueueData.MEDIA_QUEUE_TYPE_VIDEO_PLAYLIST -> MediaQueueType.VIDEOPLAYLIST
    else -> null
  }

private fun repeatModeFromGck(value: Int): MediaRepeatMode? =
  when (value) {
    GckMediaStatus.REPEAT_MODE_REPEAT_ALL -> MediaRepeatMode.ALL
    GckMediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE -> MediaRepeatMode.ALLANDSHUFFLE
    GckMediaStatus.REPEAT_MODE_REPEAT_OFF -> MediaRepeatMode.OFF
    GckMediaStatus.REPEAT_MODE_REPEAT_SINGLE -> MediaRepeatMode.SINGLE
    else -> null
  }

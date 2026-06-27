package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueItem
import com.google.android.gms.cast.MediaQueueItem as GckMediaQueueItem

/**
 * Converts a Google Cast [GckMediaQueueItem] into a generated [MediaQueueItem] struct.
 *
 * Reverse of `MediaQueueItem+toGckMediaQueueItem.kt`. Time fields are SECONDS on both sides
 * (no scaling). `itemId` equal to `INVALID_ITEM_ID` becomes `null`.
 */
internal fun GckMediaQueueItem.toMediaQueueItem(): MediaQueueItem {
  val media = requireNotNull(this.media) { "GckMediaQueueItem.media must not be null" }
  val trackIds = activeTrackIds
  return MediaQueueItem(
    mediaInfo = media.toMediaInfo(),
    itemId = if (itemId == GckMediaQueueItem.INVALID_ITEM_ID) null else itemId.toDouble(),
    activeTrackIds = trackIds?.let { DoubleArray(it.size) { i -> it[i].toDouble() } },
    autoplay = autoplay,
    playbackDuration = playbackDuration,
    preloadTime = preloadTime,
    startTime = startTime,
    customData = customData?.toAnyMap()
  )
}

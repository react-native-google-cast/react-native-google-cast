package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueItem
import com.google.android.gms.cast.MediaQueueItem as GckMediaQueueItem

/**
 * Converts a generated [MediaQueueItem] struct into a Google Cast [GckMediaQueueItem].
 *
 * The reverse lives in `GckMediaQueueItem+toMediaQueueItem.kt`. Unlike most GCK time fields,
 * MediaQueueItem's `startTime` / `playbackDuration` / `preloadTime` are already SECONDS
 * (`double`) in GCK Android, so they pass through without scaling.
 */
internal fun MediaQueueItem.toGckMediaQueueItem(): GckMediaQueueItem {
  val builder = GckMediaQueueItem.Builder(mediaInfo.toGckMediaInfo())
  itemId?.let { builder.setItemId(it.toInt()) }
  activeTrackIds?.let { ids -> builder.setActiveTrackIds(LongArray(ids.size) { ids[it].toLong() }) }
  autoplay?.let { builder.setAutoplay(it) }
  playbackDuration?.let { builder.setPlaybackDuration(it) }
  preloadTime?.let { builder.setPreloadTime(it) }
  startTime?.let { builder.setStartTime(it) }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

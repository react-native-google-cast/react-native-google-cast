package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueItem
import com.google.android.gms.cast.MediaQueueItem as GckMediaQueueItem

/**
 * Converts a Google Cast [GckMediaQueueItem] into a generated [MediaQueueItem] struct, or
 * `null` when the item carries no media information.
 *
 * Reverse of `MediaQueueItem+toGckMediaQueueItem.kt`. Time fields are SECONDS on both sides
 * (no scaling). `itemId` equal to `INVALID_ITEM_ID` becomes `null`.
 *
 * **Why this can return null.** Android's [GckMediaQueueItem.getMedia] is `@Nullable`, and the
 * receiver really does send queue entries that are known by `itemId` alone: a `MEDIA_STATUS`
 * broadcast after a queue mutation (observed on a Chromecast running the Default Media
 * Receiver right after `queueRemoveItems`) carries the new item window before the receiver has
 * populated each entry's media. Converting such an entry cannot produce a valid
 * [MediaQueueItem] — `mediaInfo` is required, deliberately: iOS declares
 * `GCKMediaQueueItem.mediaInformation` nonnull, so the guarantee holds on the platform that
 * can keep it and only Android sees the transient.
 *
 * Callers therefore **drop** these entries (`mapNotNull`) rather than crash. That is lossy for
 * one status broadcast and consistent with what `MediaStatus.queueItems` already promises — a
 * *window* on the queue, not its authoritative contents. It replaces a `requireNotNull` that
 * threw `IllegalArgumentException` straight out of a GCK main-thread callback and killed the
 * host app (v5-kbd). Not reachable from a unit test: `GckMediaQueueItem.Builder` requires a
 * `MediaInfo`, so an id-only item cannot be constructed on the sender side at all.
 */
internal fun GckMediaQueueItem.toMediaQueueItemOrNull(): MediaQueueItem? {
  val media = this.media ?: return null
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

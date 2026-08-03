package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaPlayerIdleReason
import com.margelo.nitro.googlecast.MediaPlayerState
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.margelo.nitro.googlecast.MediaStatus
import com.google.android.gms.cast.MediaQueueItem as GckMediaQueueItem
import com.google.android.gms.cast.MediaStatus as GckMediaStatus

/**
 * Converts a Google Cast [GckMediaStatus] into a generated [MediaStatus] struct.
 *
 * Reverse of `MediaStatus+toGckMediaStatus.kt`. Enum fields are mapped BY VALUE, with the GCK
 * sentinels mapping to `null` (`PLAYER_STATE_UNKNOWN`, `IDLE_REASON_NONE`). GCK milliseconds
 * become seconds. Item-id sentinels (`INVALID_ITEM_ID`) become `null`.
 */
internal fun GckMediaStatus.toMediaStatus(): MediaStatus {
  val trackIds = activeTrackIds
  // mapNotNull, not map: the receiver sends id-only queue entries after a queue mutation and
  // converting one cannot produce a valid item (v5-kbd). Dropping them keeps this off the GCK
  // main-thread callback's throw path.
  val items = queueItems?.mapNotNull { it.toMediaQueueItemOrNull() } ?: emptyList<MediaQueueItem>()
  return MediaStatus(
    mediaInfo = mediaInfo?.toMediaInfo(),
    playerState = playerStateOrNull(playerState),
    idleReason = idleReasonOrNull(idleReason),
    streamPosition = streamPosition / 1000.0,
    playbackRate = playbackRate,
    volume = streamVolume,
    isMuted = isMute,
    activeTrackIds = trackIds?.let { DoubleArray(it.size) { i -> it[i].toDouble() } },
    videoInfo = videoInfo?.toVideoInfo(),
    liveSeekableRange = liveSeekableRange?.toMediaLiveSeekableRange(),
    queueItems = items.toTypedArray(),
    currentItemId = idOrNull(currentItemId),
    loadingItemId = idOrNull(loadingItemId),
    preloadedItemId = idOrNull(preloadedItemId),
    queueRepeatMode = repeatModeOrNull(queueRepeatMode),
    customData = customData?.toAnyMap()
  )
}

private fun playerStateOrNull(value: Int): MediaPlayerState? =
  when (value) {
    GckMediaStatus.PLAYER_STATE_BUFFERING -> MediaPlayerState.BUFFERING
    GckMediaStatus.PLAYER_STATE_IDLE -> MediaPlayerState.IDLE
    GckMediaStatus.PLAYER_STATE_LOADING -> MediaPlayerState.LOADING
    GckMediaStatus.PLAYER_STATE_PAUSED -> MediaPlayerState.PAUSED
    GckMediaStatus.PLAYER_STATE_PLAYING -> MediaPlayerState.PLAYING
    else -> null
  }

private fun idleReasonOrNull(value: Int): MediaPlayerIdleReason? =
  when (value) {
    GckMediaStatus.IDLE_REASON_CANCELED -> MediaPlayerIdleReason.CANCELLED
    GckMediaStatus.IDLE_REASON_ERROR -> MediaPlayerIdleReason.ERROR
    GckMediaStatus.IDLE_REASON_FINISHED -> MediaPlayerIdleReason.FINISHED
    GckMediaStatus.IDLE_REASON_INTERRUPTED -> MediaPlayerIdleReason.INTERRUPTED
    else -> null
  }

private fun repeatModeOrNull(value: Int): MediaRepeatMode? =
  when (value) {
    GckMediaStatus.REPEAT_MODE_REPEAT_ALL -> MediaRepeatMode.ALL
    GckMediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE -> MediaRepeatMode.ALLANDSHUFFLE
    GckMediaStatus.REPEAT_MODE_REPEAT_OFF -> MediaRepeatMode.OFF
    GckMediaStatus.REPEAT_MODE_REPEAT_SINGLE -> MediaRepeatMode.SINGLE
    else -> null
  }

private fun idOrNull(value: Int): Double? =
  if (value == GckMediaQueueItem.INVALID_ITEM_ID) null else value.toDouble()

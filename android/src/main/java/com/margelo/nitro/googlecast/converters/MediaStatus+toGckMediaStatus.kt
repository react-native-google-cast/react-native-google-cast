package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaPlayerIdleReason
import com.margelo.nitro.googlecast.MediaPlayerState
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.margelo.nitro.googlecast.MediaStatus
import com.google.android.gms.cast.MediaStatus as GckMediaStatus

/**
 * Converts a generated [MediaStatus] struct into a Google Cast [GckMediaStatus].
 *
 * The reverse lives in `GckMediaStatus+toMediaStatus.kt`. Built via GCK's public `Builder`.
 * Enum fields are mapped BY VALUE. `streamPosition` is seconds in the struct / milliseconds
 * (`long`) in GCK. Nested structs delegate to their own converters.
 */
internal fun MediaStatus.toGckMediaStatus(): GckMediaStatus {
  val builder = GckMediaStatus.Builder()
  mediaInfo?.let { builder.setMediaInfo(it.toGckMediaInfo()) }
  playerState?.let { builder.setPlayerState(it.toGckPlayerState()) }
  idleReason?.let { builder.setIdleReason(it.toGckIdleReason()) }
  builder.setStreamPosition((streamPosition * 1000).toLong())
  builder.setPlaybackRate(playbackRate)
  builder.setStreamVolume(volume)
  builder.setIsMute(isMuted)
  activeTrackIds?.let { ids -> builder.setActiveTrackIds(LongArray(ids.size) { ids[it].toLong() }) }
  videoInfo?.let { builder.setVideoInfo(it.toGckVideoInfo()) }
  liveSeekableRange?.let { builder.setLiveSeekableRange(it.toGckMediaLiveSeekableRange()) }
  builder.setQueueItems(queueItems.map { it.toGckMediaQueueItem() })
  currentItemId?.let { builder.setCurrentItemId(it.toInt()) }
  loadingItemId?.let { builder.setLoadingItemId(it.toInt()) }
  preloadedItemId?.let { builder.setPreloadedItemId(it.toInt()) }
  queueRepeatMode?.let { builder.setQueueRepeatMode(it.toGckRepeatMode()) }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

private fun MediaPlayerState.toGckPlayerState(): Int =
  when (this) {
    MediaPlayerState.BUFFERING -> GckMediaStatus.PLAYER_STATE_BUFFERING
    MediaPlayerState.IDLE -> GckMediaStatus.PLAYER_STATE_IDLE
    MediaPlayerState.LOADING -> GckMediaStatus.PLAYER_STATE_LOADING
    MediaPlayerState.PAUSED -> GckMediaStatus.PLAYER_STATE_PAUSED
    MediaPlayerState.PLAYING -> GckMediaStatus.PLAYER_STATE_PLAYING
  }

private fun MediaPlayerIdleReason.toGckIdleReason(): Int =
  when (this) {
    MediaPlayerIdleReason.CANCELLED -> GckMediaStatus.IDLE_REASON_CANCELED
    MediaPlayerIdleReason.ERROR -> GckMediaStatus.IDLE_REASON_ERROR
    MediaPlayerIdleReason.FINISHED -> GckMediaStatus.IDLE_REASON_FINISHED
    MediaPlayerIdleReason.INTERRUPTED -> GckMediaStatus.IDLE_REASON_INTERRUPTED
  }

private fun MediaRepeatMode.toGckRepeatMode(): Int =
  when (this) {
    MediaRepeatMode.ALL -> GckMediaStatus.REPEAT_MODE_REPEAT_ALL
    MediaRepeatMode.ALLANDSHUFFLE -> GckMediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE
    MediaRepeatMode.OFF -> GckMediaStatus.REPEAT_MODE_REPEAT_OFF
    MediaRepeatMode.SINGLE -> GckMediaStatus.REPEAT_MODE_REPEAT_SINGLE
  }

package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaLoadRequest
import com.google.android.gms.cast.MediaLoadRequestData as GckMediaLoadRequestData

/**
 * Converts a Google Cast [GckMediaLoadRequestData] into a generated [MediaLoadRequest] struct.
 *
 * Reverse of `MediaLoadRequest+toGckMediaLoadRequestData.kt`. GCK's `currentTime` maps back to
 * the struct's `startTime` (milliseconds → seconds); `PLAY_POSITION_UNASSIGNED` becomes
 * `null`. `playbackRate` is a GCK primitive with no "absent" representation, so it is always
 * emitted (a `null` input round-trips to the GCK default — a parity reconciliation point).
 */
internal fun GckMediaLoadRequestData.toMediaLoadRequest(): MediaLoadRequest =
  MediaLoadRequest(
    mediaInfo = mediaInfo?.toMediaInfo(),
    queueData = queueData?.toMediaQueueData(),
    autoplay = autoplay,
    startTime = if (currentTime == GckMediaLoadRequestData.PLAY_POSITION_UNASSIGNED) {
      null
    } else {
      currentTime / 1000.0
    },
    playbackRate = playbackRate,
    credentials = credentials,
    credentialsType = credentialsType,
    customData = customData?.toAnyMap()
  )

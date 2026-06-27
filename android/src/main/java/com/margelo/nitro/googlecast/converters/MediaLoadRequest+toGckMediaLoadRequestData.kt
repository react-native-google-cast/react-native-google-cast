package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaLoadRequest
import com.google.android.gms.cast.MediaLoadRequestData as GckMediaLoadRequestData

/**
 * Converts a generated [MediaLoadRequest] struct into a Google Cast [GckMediaLoadRequestData].
 *
 * The reverse lives in `GckMediaLoadRequestData+toMediaLoadRequest.kt`. The struct's
 * `startTime` maps to GCK's `currentTime` (seconds → milliseconds `long`). `autoplay` is a
 * nullable `Boolean` on both sides.
 */
internal fun MediaLoadRequest.toGckMediaLoadRequestData(): GckMediaLoadRequestData {
  val builder = GckMediaLoadRequestData.Builder()
  mediaInfo?.let { builder.setMediaInfo(it.toGckMediaInfo()) }
  queueData?.let { builder.setQueueData(it.toGckMediaQueueData()) }
  autoplay?.let { builder.setAutoplay(it) }
  startTime?.let { builder.setCurrentTime((it * 1000).toLong()) }
  playbackRate?.let { builder.setPlaybackRate(it) }
  credentials?.let { builder.setCredentials(it) }
  credentialsType?.let { builder.setCredentialsType(it) }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

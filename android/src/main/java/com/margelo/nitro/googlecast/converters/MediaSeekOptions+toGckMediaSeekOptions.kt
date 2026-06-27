package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaSeekOptions
import com.margelo.nitro.googlecast.MediaSeekResumeState
import com.google.android.gms.cast.MediaSeekOptions as GckMediaSeekOptions

/**
 * Converts a generated [MediaSeekOptions] struct into a Google Cast [GckMediaSeekOptions].
 *
 * The reverse lives in `GckMediaSeekOptions+toMediaSeekOptions.kt`. `position` is seconds in
 * the struct / milliseconds (`long`) in GCK. `resumeState` is mapped BY VALUE.
 *
 * The struct's `relative` flag has NO GCK Android counterpart (GCK only models an absolute
 * seek position), so it is dropped here and reported as `null` on the reverse — an
 * iOS/Android reconciliation point for the parity pass.
 */
internal fun MediaSeekOptions.toGckMediaSeekOptions(): GckMediaSeekOptions {
  val builder = GckMediaSeekOptions.Builder()
  position?.let { builder.setPosition((it * 1000).toLong()) }
  infinite?.let { builder.setIsSeekToInfinite(it) }
  resumeState?.let {
    val gckState = when (it) {
      MediaSeekResumeState.PLAY -> GckMediaSeekOptions.RESUME_STATE_PLAY
      MediaSeekResumeState.PAUSE -> GckMediaSeekOptions.RESUME_STATE_PAUSE
    }
    builder.setResumeState(gckState)
  }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

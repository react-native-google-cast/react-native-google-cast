package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaSeekOptions
import com.margelo.nitro.googlecast.MediaSeekResumeState
import com.google.android.gms.cast.MediaSeekOptions as GckMediaSeekOptions

/**
 * Converts a Google Cast [GckMediaSeekOptions] into a generated [MediaSeekOptions] struct.
 *
 * Reverse of `MediaSeekOptions+toGckMediaSeekOptions.kt`. GCK milliseconds become seconds.
 * `resumeState` is mapped BY VALUE; `RESUME_STATE_UNCHANGED` becomes `null`. `relative` has no
 * GCK source and is always `null`.
 */
internal fun GckMediaSeekOptions.toMediaSeekOptions(): MediaSeekOptions {
  val mappedResume = when (resumeState) {
    GckMediaSeekOptions.RESUME_STATE_PLAY -> MediaSeekResumeState.PLAY
    GckMediaSeekOptions.RESUME_STATE_PAUSE -> MediaSeekResumeState.PAUSE
    else -> null
  }
  return MediaSeekOptions(
    position = position / 1000.0,
    relative = null,
    infinite = isSeekToInfinite,
    resumeState = mappedResume,
    customData = customData?.toAnyMap()
  )
}

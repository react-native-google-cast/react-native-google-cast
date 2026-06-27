package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaLiveSeekableRange
import com.google.android.gms.cast.MediaLiveSeekableRange as GckMediaLiveSeekableRange

/**
 * Converts a Google Cast [GckMediaLiveSeekableRange] into a generated [MediaLiveSeekableRange]
 * struct.
 *
 * Reverse of `MediaLiveSeekableRange+toGckMediaLiveSeekableRange.kt`. GCK milliseconds are
 * converted back to the struct's seconds (`Double`).
 */
internal fun GckMediaLiveSeekableRange.toMediaLiveSeekableRange(): MediaLiveSeekableRange =
  MediaLiveSeekableRange(
    startTime = startTime / 1000.0,
    endTime = endTime / 1000.0,
    isMovingWindow = isMovingWindow,
    isLiveDone = isLiveDone
  )

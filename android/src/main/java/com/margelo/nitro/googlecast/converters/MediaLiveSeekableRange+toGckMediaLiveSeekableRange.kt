package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaLiveSeekableRange
import com.google.android.gms.cast.MediaLiveSeekableRange as GckMediaLiveSeekableRange

/**
 * Converts a generated [MediaLiveSeekableRange] struct into a Google Cast
 * [GckMediaLiveSeekableRange].
 *
 * The reverse lives in `GckMediaLiveSeekableRange+toMediaLiveSeekableRange.kt`. GCK stores
 * the window bounds as milliseconds (`long`); our struct uses seconds (`Double`), matching
 * iOS, so times are scaled by 1000 here and divided back on the reverse.
 */
internal fun MediaLiveSeekableRange.toGckMediaLiveSeekableRange(): GckMediaLiveSeekableRange =
  GckMediaLiveSeekableRange.Builder()
    .setStartTime((startTime * 1000).toLong())
    .setEndTime((endTime * 1000).toLong())
    .setIsMovingWindow(isMovingWindow)
    .setIsLiveDone(isLiveDone)
    .build()

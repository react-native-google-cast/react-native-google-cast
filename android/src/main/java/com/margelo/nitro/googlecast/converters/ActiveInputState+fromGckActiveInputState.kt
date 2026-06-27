package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ActiveInputState
import com.google.android.gms.cast.Cast

/**
 * Maps a Google Cast `Cast.ACTIVE_INPUT_STATE_*` int back to our [ActiveInputState] by VALUE.
 *
 * Reverse of `ActiveInputState+toGckActiveInputState.kt`. Any unrecognized value collapses to
 * [ActiveInputState.UNKNOWN], matching GCK's own default.
 */
internal fun ActiveInputState.Companion.fromGckActiveInputState(value: Int): ActiveInputState =
  when (value) {
    Cast.ACTIVE_INPUT_STATE_NO -> ActiveInputState.INACTIVE
    Cast.ACTIVE_INPUT_STATE_YES -> ActiveInputState.ACTIVE
    else -> ActiveInputState.UNKNOWN
  }

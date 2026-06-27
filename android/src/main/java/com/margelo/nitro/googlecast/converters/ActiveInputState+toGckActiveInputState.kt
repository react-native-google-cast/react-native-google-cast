package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ActiveInputState
import com.google.android.gms.cast.Cast

/**
 * Maps our [ActiveInputState] to the Google Cast `Cast.ACTIVE_INPUT_STATE_*` int by VALUE.
 *
 * GCK does not expose a dedicated type; active-input state is a plain int constant
 * (`UNKNOWN = -1`, `NO = 0`, `YES = 1`). The reverse lives in
 * `ActiveInputState+fromGckActiveInputState.kt`.
 */
internal fun ActiveInputState.toGckActiveInputState(): Int =
  when (this) {
    ActiveInputState.UNKNOWN -> Cast.ACTIVE_INPUT_STATE_UNKNOWN
    ActiveInputState.INACTIVE -> Cast.ACTIVE_INPUT_STATE_NO
    ActiveInputState.ACTIVE -> Cast.ACTIVE_INPUT_STATE_YES
  }

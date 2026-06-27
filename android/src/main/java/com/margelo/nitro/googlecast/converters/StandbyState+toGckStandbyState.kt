package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.StandbyState
import com.google.android.gms.cast.Cast

/**
 * Maps our [StandbyState] to the Google Cast `Cast.STANDBY_STATE_*` int by VALUE.
 *
 * GCK exposes standby state as a plain int constant (`UNKNOWN = -1`, `NO = 0`, `YES = 1`).
 * The reverse lives in `StandbyState+fromGckStandbyState.kt`.
 */
internal fun StandbyState.toGckStandbyState(): Int =
  when (this) {
    StandbyState.UNKNOWN -> Cast.STANDBY_STATE_UNKNOWN
    StandbyState.INACTIVE -> Cast.STANDBY_STATE_NO
    StandbyState.ACTIVE -> Cast.STANDBY_STATE_YES
  }

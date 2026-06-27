package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.StandbyState
import com.google.android.gms.cast.Cast

/**
 * Maps a Google Cast `Cast.STANDBY_STATE_*` int back to our [StandbyState] by VALUE.
 *
 * Reverse of `StandbyState+toGckStandbyState.kt`. Any unrecognized value collapses to
 * [StandbyState.UNKNOWN].
 */
internal fun StandbyState.Companion.fromGckStandbyState(value: Int): StandbyState =
  when (value) {
    Cast.STANDBY_STATE_NO -> StandbyState.INACTIVE
    Cast.STANDBY_STATE_YES -> StandbyState.ACTIVE
    else -> StandbyState.UNKNOWN
  }

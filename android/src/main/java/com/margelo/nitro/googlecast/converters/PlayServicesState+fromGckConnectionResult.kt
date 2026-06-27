package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.PlayServicesState
import com.google.android.gms.common.ConnectionResult

/**
 * Maps a Google Play services `ConnectionResult` int back to our [PlayServicesState] by MEANING.
 *
 * Reverse of `PlayServicesState+toGckConnectionResult.kt`. Any unrecognized code collapses to
 * [PlayServicesState.INVALID].
 */
internal fun PlayServicesState.Companion.fromGckConnectionResult(value: Int): PlayServicesState =
  when (value) {
    ConnectionResult.SUCCESS -> PlayServicesState.SUCCESS
    ConnectionResult.SERVICE_MISSING -> PlayServicesState.MISSING
    ConnectionResult.SERVICE_UPDATING -> PlayServicesState.UPDATING
    ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED -> PlayServicesState.UPDATEREQUIRED
    ConnectionResult.SERVICE_DISABLED -> PlayServicesState.DISABLED
    else -> PlayServicesState.INVALID
  }

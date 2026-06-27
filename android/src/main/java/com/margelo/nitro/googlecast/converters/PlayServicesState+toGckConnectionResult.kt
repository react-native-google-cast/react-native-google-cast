package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.PlayServicesState
import com.google.android.gms.common.ConnectionResult

/**
 * Maps our [PlayServicesState] to a Google Play services `ConnectionResult` int by MEANING.
 *
 * The two enumerations do NOT share ordinals: our union is dense (0..5) while
 * `ConnectionResult` uses sparse codes (`SUCCESS = 0`, `SERVICE_MISSING = 1`,
 * `SERVICE_VERSION_UPDATE_REQUIRED = 2`, `SERVICE_DISABLED = 3`, `SERVICE_INVALID = 9`,
 * `SERVICE_UPDATING = 18`). The reverse lives in
 * `PlayServicesState+fromGckConnectionResult.kt`.
 */
internal fun PlayServicesState.toGckConnectionResult(): Int =
  when (this) {
    PlayServicesState.SUCCESS -> ConnectionResult.SUCCESS
    PlayServicesState.MISSING -> ConnectionResult.SERVICE_MISSING
    PlayServicesState.UPDATING -> ConnectionResult.SERVICE_UPDATING
    PlayServicesState.UPDATEREQUIRED -> ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED
    PlayServicesState.DISABLED -> ConnectionResult.SERVICE_DISABLED
    PlayServicesState.INVALID -> ConnectionResult.SERVICE_INVALID
  }

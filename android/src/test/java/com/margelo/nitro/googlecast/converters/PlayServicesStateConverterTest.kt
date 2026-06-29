package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.PlayServicesState
import com.google.android.gms.common.ConnectionResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the PlayServicesState enum↔GCK converter (Android side of T1).
 *
 * PlayServicesState is Android-only (no iOS GCK counterpart; iOS does not test this enum).
 * The mapping uses `ConnectionResult` codes which are sparse: SUCCESS=0, SERVICE_MISSING=1,
 * SERVICE_VERSION_UPDATE_REQUIRED=2, SERVICE_DISABLED=3, SERVICE_INVALID=9, SERVICE_UPDATING=18.
 * Any unrecognized code collapses to INVALID.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class PlayServicesStateConverterTest {

  @Test
  fun forwardMapsToConnectionResultCodes() {
    assertEquals("SUCCESS", ConnectionResult.SUCCESS, PlayServicesState.SUCCESS.toGckConnectionResult())
    assertEquals("MISSING", ConnectionResult.SERVICE_MISSING, PlayServicesState.MISSING.toGckConnectionResult())
    assertEquals("UPDATING", ConnectionResult.SERVICE_UPDATING, PlayServicesState.UPDATING.toGckConnectionResult())
    assertEquals("UPDATEREQUIRED", ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED, PlayServicesState.UPDATEREQUIRED.toGckConnectionResult())
    assertEquals("DISABLED", ConnectionResult.SERVICE_DISABLED, PlayServicesState.DISABLED.toGckConnectionResult())
    assertEquals("INVALID", ConnectionResult.SERVICE_INVALID, PlayServicesState.INVALID.toGckConnectionResult())
  }

  @Test
  fun reverseRoundTrips() {
    assertEquals("SUCCESS", PlayServicesState.SUCCESS, PlayServicesState.fromGckConnectionResult(ConnectionResult.SUCCESS))
    assertEquals("MISSING", PlayServicesState.MISSING, PlayServicesState.fromGckConnectionResult(ConnectionResult.SERVICE_MISSING))
    assertEquals("UPDATING", PlayServicesState.UPDATING, PlayServicesState.fromGckConnectionResult(ConnectionResult.SERVICE_UPDATING))
    assertEquals("UPDATEREQUIRED", PlayServicesState.UPDATEREQUIRED, PlayServicesState.fromGckConnectionResult(ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED))
    assertEquals("DISABLED", PlayServicesState.DISABLED, PlayServicesState.fromGckConnectionResult(ConnectionResult.SERVICE_DISABLED))
    assertEquals("INVALID", PlayServicesState.INVALID, PlayServicesState.fromGckConnectionResult(ConnectionResult.SERVICE_INVALID))
  }

  @Test
  fun unrecognizedCodeFallsBackToInvalid() {
    assertEquals("code 999 → INVALID", PlayServicesState.INVALID, PlayServicesState.fromGckConnectionResult(999))
    assertEquals("code 42 → INVALID", PlayServicesState.INVALID, PlayServicesState.fromGckConnectionResult(42))
  }
}

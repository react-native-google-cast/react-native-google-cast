package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ApplicationMetadata
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the ApplicationMetadata struct↔GCK converter (Android side of T1d).
 *
 * `ApplicationMetadata` becomes a *bridged* struct once it is nested in `SessionInfo`, so its
 * app-facing reverse converter needs coverage. Mirrors `StandbyStateConverterTest` style: build
 * a `GckApplicationMetadata` via the reflection test-seam (`toGckApplicationMetadata`), run the
 * real reverse (`toApplicationMetadata`), and assert the round trip.
 *
 * Reconciliation reality the DRAFT `fixtures/converters/applicationMetadata.json` flagged:
 * `getImages()` is deprecated and returns `null` in play-services-cast 22.x, so `images` is
 * ALWAYS `[]` on Android regardless of input — the seam cannot represent images either. The
 * fixture's `"full"` case still lists a populated `expectedRoundTrip.images`, which this test
 * proves wrong; see the reported follow-up.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class ApplicationMetadataConverterTest {

  @Test
  fun reverseRoundTripPreservesScalarsAndNamespacesButDropsImages() {
    val input =
      ApplicationMetadata(
        applicationId = "ABCD1234",
        images = emptyArray(),
        name = "My Cast App",
        namespaces = arrayOf("urn:x-cast:com.example.custom", "urn:x-cast:com.google.cast.media")
      )

    val actual = input.toGckApplicationMetadata().toApplicationMetadata()

    assertEquals("applicationId", "ABCD1234", actual.applicationId)
    assertEquals("name", "My Cast App", actual.name)
    assertArrayEquals(
      "namespaces",
      arrayOf("urn:x-cast:com.example.custom", "urn:x-cast:com.google.cast.media"),
      actual.namespaces
    )
    assertTrue("images always [] on Android (getImages deprecated in 22.x)", actual.images.isEmpty())
  }

  @Test
  fun minimalRoundTripEmptyNamespacesAndImages() {
    val input =
      ApplicationMetadata(
        applicationId = "X1",
        images = emptyArray(),
        name = "App",
        namespaces = emptyArray()
      )

    val actual = input.toGckApplicationMetadata().toApplicationMetadata()

    assertEquals("applicationId", "X1", actual.applicationId)
    assertEquals("name", "App", actual.name)
    assertTrue("namespaces empty", actual.namespaces.isEmpty())
    assertTrue("images empty", actual.images.isEmpty())
  }
}

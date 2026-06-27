package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.WebImage
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the WebImage struct↔GCK converter (Android side of T1).
 *
 * Drives each fixture through `struct → GCK → struct` and asserts the result deep-equals
 * the corpus's `expectedRoundTrip`. It also pins the GCK-side values directly (so a
 * symmetric mapping bug that survives the round trip is still caught). The iOS XCTest
 * suite asserts the same `expectedRoundTrip` values, giving the cross-platform guarantee.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class WebImageConverterTest {
  @Test
  fun roundTripsAllFixtures() {
    val fixtures = ConverterCorpus.load("webImage")
    require(fixtures.length() > 0) { "webImage corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val input = webImageFromJson(fixture.getJSONObject("input"))
      val expected = webImageFromJson(fixture.getJSONObject("expectedRoundTrip"))

      // Pin the GCK side directly to catch symmetric (both-directions) mapping bugs.
      val gck = input.toGckWebImage()
      assertEquals("[$name] gck url", expected.url, gck.url.toString())
      assertEquals("[$name] gck width", expected.width?.toInt(), gck.width)
      assertEquals("[$name] gck height", expected.height?.toInt(), gck.height)

      // Full round trip identity against the shared corpus.
      val actual = gck.toWebImage()
      assertEquals("[$name] url", expected.url, actual.url)
      assertEquals("[$name] width", expected.width, actual.width)
      assertEquals("[$name] height", expected.height, actual.height)
    }
  }

  private fun webImageFromJson(json: JSONObject): WebImage {
    return WebImage(
      url = json.getString("url"),
      width = if (json.has("width")) json.getDouble("width") else null,
      height = if (json.has("height")) json.getDouble("height") else null
    )
  }
}

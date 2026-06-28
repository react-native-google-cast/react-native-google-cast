package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaLiveSeekableRange
import com.google.android.gms.cast.MediaLiveSeekableRange as GckMediaLiveSeekableRange
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the MediaLiveSeekableRange struct↔GCK converter (Android side of T1).
 *
 * GCK stores range bounds as milliseconds (Long); our struct uses seconds (Double).
 * The conversion is exact (no float precision loss for the corpus values) so the round-trip
 * assertion uses exact equality, matching the iOS XCTest pattern.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class MediaLiveSeekableRangeConverterTest {

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = ConverterCorpus.load("mediaLiveSeekableRange")
    require(fixtures.length() > 0) { "mediaLiveSeekableRange corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = rangeFromJson(inputJson)
      val expected = rangeFromJson(expectedJson)

      val gck = input.toGckMediaLiveSeekableRange()

      // Pin GCK side (milliseconds) against the input (seconds × 1000).
      assertEquals("[$name] gck startTime ms", (input.startTime * 1000).toLong(), gck.startTime)
      assertEquals("[$name] gck endTime ms", (input.endTime * 1000).toLong(), gck.endTime)
      assertEquals("[$name] gck isMovingWindow", input.isMovingWindow, gck.isMovingWindow)
      assertEquals("[$name] gck isLiveDone", input.isLiveDone, gck.isLiveDone)

      val actual = gck.toMediaLiveSeekableRange()
      assertEquals("[$name] startTime", expected.startTime, actual.startTime, 1e-9)
      assertEquals("[$name] endTime", expected.endTime, actual.endTime, 1e-9)
      assertEquals("[$name] isMovingWindow", expected.isMovingWindow, actual.isMovingWindow)
      assertEquals("[$name] isLiveDone", expected.isLiveDone, actual.isLiveDone)
    }
  }

  private fun rangeFromJson(json: JSONObject): MediaLiveSeekableRange = MediaLiveSeekableRange(
    startTime = json.getDouble("startTime"),
    endTime = json.getDouble("endTime"),
    isMovingWindow = json.getBoolean("isMovingWindow"),
    isLiveDone = json.getBoolean("isLiveDone")
  )
}

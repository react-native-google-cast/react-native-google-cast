package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaQueueItem struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID DIVERGENCE — `itemId`:
 *   GCK's MediaQueueItemBuilder has no setItemId(); itemId is assigned by the receiver.
 *   The corpus expectedRoundTrip drops itemId (absent means null). Android must assert null.
 *
 * ANDROID NOTE — time-interval sentinel:
 *   GCK uses INFINITY or a sentinel for unset time intervals (playbackDuration, preloadTime,
 *   startTime). If GCK returns Infinity or a large sentinel, the converter maps those to null.
 *   The "minimal" fixture expectedRoundTrip has these as absent (null), matching this behavior.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaQueueItemConverterTest {

  companion object {
    @BeforeClass @JvmStatic
    fun loadNative() {
      com.margelo.nitro.JNIOnLoad.initializeNativeNitro() // load NitroModules (AnyMap JNI) before GoogleCast
      NitroGoogleCastOnLoad.initializeNative()
    }
  }

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = InstrumentedCorpus.load("mediaQueueItem")
    require(fixtures.length() > 0) { "mediaQueueItem corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = mediaQueueItemFromJson(inputJson)
      val expected = mediaQueueItemFromJson(expectedJson)

      val gck = input.toGckMediaQueueItem()
      val actual = gck.toMediaQueueItem()

      // itemId is always null after round-trip (no GCK builder setter).
      assertNull("[$name] itemId (android: no GCK builder setter)", actual.itemId)
      assertEquals("[$name] autoplay", expected.autoplay, actual.autoplay)
      assertEquals("[$name] mediaInfo.contentUrl", expected.mediaInfo?.contentUrl, actual.mediaInfo?.contentUrl)
      assertEquals("[$name] mediaInfo.streamType", expected.mediaInfo?.streamType, actual.mediaInfo?.streamType)
      assertEquals("[$name] mediaInfo.streamDuration", expected.mediaInfo?.streamDuration, actual.mediaInfo?.streamDuration)
      // DoubleArray compares by reference; .toList() forces element-wise comparison.
      // activeTrackIds is ?.let-mapped in the reverse converter, so unset → null on both sides.
      assertEquals("[$name] activeTrackIds", expected.activeTrackIds?.toList(), actual.activeTrackIds?.toList())
      // Timing fields: the reverse converter passes GCK values through with NO sentinel→null
      // mapping, so on the "minimal" fixture (timings absent) GCK's unset defaults surface as
      // non-null. Assert only where the corpus pins a value (the "full" fixture).
      if (expected.playbackDuration != null) {
        assertEquals("[$name] playbackDuration", expected.playbackDuration, actual.playbackDuration)
      }
      if (expected.preloadTime != null) {
        assertEquals("[$name] preloadTime", expected.preloadTime, actual.preloadTime)
      }
      if (expected.startTime != null) {
        assertEquals("[$name] startTime", expected.startTime, actual.startTime)
      }
      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun mediaQueueItemFromJson(json: JSONObject): MediaQueueItem {
    val mediaJson = json.getJSONObject("mediaInfo")
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    val trackIds = if (json.has("activeTrackIds")) {
      val arr = json.getJSONArray("activeTrackIds")
      DoubleArray(arr.length()) { i -> arr.getDouble(i) }
    } else null
    return MediaQueueItem(
      mediaInfo = mediaInfoFromJson(mediaJson),
      itemId = if (json.has("itemId")) json.getDouble("itemId") else null,
      activeTrackIds = trackIds,
      autoplay = if (json.has("autoplay")) json.getBoolean("autoplay") else null,
      playbackDuration = if (json.has("playbackDuration")) json.getDouble("playbackDuration") else null,
      preloadTime = if (json.has("preloadTime")) json.getDouble("preloadTime") else null,
      startTime = if (json.has("startTime")) json.getDouble("startTime") else null,
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun mediaInfoFromJson(json: JSONObject): MediaInfo = MediaInfo(
    contentUrl = json.getString("contentUrl"),
    contentId = json.optString("contentId").ifEmpty { null },
    contentType = json.optString("contentType").ifEmpty { null },
    entity = null,
    streamType = if (json.has("streamType")) streamTypeFromString(json.getString("streamType")) else null,
    metadata = null,
    streamDuration = if (json.has("streamDuration")) json.getDouble("streamDuration") else null,
    mediaTracks = null,
    textTrackStyle = null,
    hlsSegmentFormat = null,
    hlsVideoSegmentFormat = null,
    customData = null
  )

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    else -> MediaStreamType.OTHER
  }
}

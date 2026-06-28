package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaLoadRequest
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaLoadRequest struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID DIVERGENCE — `autoplay` and `playbackRate` defaults:
 *   GCK always emits autoplay (non-optional primitive). The corpus "minimal" expectedRoundTrip
 *   has `autoplay: true` (GCK Android builder default). `playbackRate` is always emitted as
 *   a primitive (default 1.0); the corpus "minimal" has `playbackRate: 1`.
 *   `startTime` absent → PLAY_POSITION_UNASSIGNED sentinel → null on reverse.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaLoadRequestConverterTest {

  companion object {
    @BeforeClass @JvmStatic
    fun loadNative() {
      NitroGoogleCastOnLoad.initializeNative()
    }
  }

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = InstrumentedCorpus.load("mediaLoadRequest")
    require(fixtures.length() > 0) { "mediaLoadRequest corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = loadRequestFromJson(inputJson)
      val expected = loadRequestFromJson(expectedJson)

      val gck = input.toGckMediaLoadRequestData()
      val actual = gck.toMediaLoadRequest()

      assertEquals("[$name] autoplay", expected.autoplay, actual.autoplay)
      assertEquals("[$name] startTime", expected.startTime, actual.startTime)
      assertEquals("[$name] playbackRate", expected.playbackRate, actual.playbackRate)
      assertEquals("[$name] credentials", expected.credentials, actual.credentials)
      assertEquals("[$name] credentialsType", expected.credentialsType, actual.credentialsType)
      if (expected.mediaInfo != null) {
        assertEquals("[$name] mediaInfo.contentUrl", expected.mediaInfo?.contentUrl, actual.mediaInfo?.contentUrl)
      }
      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun loadRequestFromJson(json: JSONObject): MediaLoadRequest {
    val mediaJson = if (json.has("mediaInfo")) json.getJSONObject("mediaInfo") else null
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return MediaLoadRequest(
      mediaInfo = mediaJson?.let { mediaInfoFromJson(it) },
      queueData = null,
      autoplay = if (json.has("autoplay")) json.getBoolean("autoplay") else null,
      startTime = if (json.has("startTime")) json.getDouble("startTime") else null,
      playbackRate = if (json.has("playbackRate")) json.getDouble("playbackRate") else null,
      credentials = json.optString("credentials").ifEmpty { null },
      credentialsType = json.optString("credentialsType").ifEmpty { null },
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun mediaInfoFromJson(json: JSONObject): MediaInfo = MediaInfo(
    contentUrl = json.getString("contentUrl"),
    contentId = null, contentType = null, entity = null,
    streamType = if (json.has("streamType")) streamTypeFromString(json.getString("streamType")) else null,
    metadata = null,
    streamDuration = if (json.has("streamDuration")) json.getDouble("streamDuration") else null,
    mediaTracks = null, textTrackStyle = null,
    hlsSegmentFormat = null, hlsVideoSegmentFormat = null, customData = null
  )

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    else -> MediaStreamType.OTHER
  }
}

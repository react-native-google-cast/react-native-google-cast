package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaHlsSegmentFormat
import com.margelo.nitro.googlecast.MediaHlsVideoSegmentFormat
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.MediaTrack
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaInfo struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * NO PLATFORM BRANCHES. Every field is asserted against the shared corpus. Two fields used
 * to need one, and both gaps were closed by making the converters agree rather than by
 * teaching the test to accept a difference:
 *
 *   streamType — GCK Android left an unset streamType INVALID (-> null) where iOS defaulted
 *   to BUFFERED. 61aecc6 defaults an omitted one to BUFFERED on both, matching the Chrome
 *   sender SDK so the same MediaLoadRequest behaves identically on all three platforms.
 *
 *   streamDuration — GCK Android maps an unset duration to UNKNOWN_DURATION (-> null), while
 *   iOS left GCKMediaInformationBuilder's default of 0. v5-3mg makes iOS write
 *   kGCKInvalidTimeInterval instead, so an omitted duration stays omitted on both. That one
 *   was found on the WIRE (`"duration":0` vs `"duration":null`) by the device-pass media
 *   oracle, not by this test — struct-level parity is necessary but not sufficient.
 *
 * If a future divergence looks like it needs a branch here, prefer closing it in the
 * converters: a branch encodes the difference permanently and outlives the reason for it.
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 */
@RunWith(AndroidJUnit4::class)
class MediaInfoConverterTest {

  companion object {
    @BeforeClass @JvmStatic
    fun loadNative() {
      // Bare androidTest process: bootstrap the native stack a real RN app sets up in
      // MainApplication. fbjni's HybridData (used by AnyMap) loads libfbjni via NativeLoader,
      // which must be initialized first; then NitroModules (the AnyMap JNI) is loaded explicitly
      // (System.loadLibrary fires JNI_OnLoad only for directly-loaded libs, not transitive deps).
      if (!com.facebook.soloader.nativeloader.NativeLoader.isInitialized()) {
        com.facebook.soloader.nativeloader.NativeLoader.init(com.facebook.soloader.nativeloader.SystemDelegate())
      }
      com.margelo.nitro.JNIOnLoad.initializeNativeNitro()
      NitroGoogleCastOnLoad.initializeNative()
    }
  }

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = InstrumentedCorpus.load("mediaInfo")
    require(fixtures.length() > 0) { "mediaInfo corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = mediaInfoFromJson(inputJson)
      val expected = mediaInfoFromJson(expectedJson)

      val gck = input.toGckMediaInfo()
      val actual = gck.toMediaInfo()

      assertEquals("[$name] contentUrl", expected.contentUrl, actual.contentUrl)
      assertEquals("[$name] contentId", expected.contentId, actual.contentId)
      assertEquals("[$name] contentType", expected.contentType, actual.contentType)
      assertEquals("[$name] entity", expected.entity, actual.entity)
      // No platform branch since 61aecc6 — an omitted streamType defaults to BUFFERED on both
      // native platforms, so the shared corpus is the expectation (see class note).
      assertEquals("[$name] streamType", expected.streamType, actual.streamType)
      // No platform branch since v5-3mg — an omitted streamDuration stays omitted on both
      // native platforms, so the shared corpus is the expectation (see class note).
      assertEquals("[$name] streamDuration", expected.streamDuration, actual.streamDuration)
      assertEquals("[$name] hlsSegmentFormat", expected.hlsSegmentFormat, actual.hlsSegmentFormat)
      assertEquals("[$name] hlsVideoSegmentFormat", expected.hlsVideoSegmentFormat, actual.hlsVideoSegmentFormat)

      // mediaTracks round-trip. `expected` is built by the same helper, which parses
      // id/type/contentId/contentType/language/name/customData (subtype is not exercised
      // here — the standalone MediaTrackConverterTest covers the full MediaTrack surface).
      val expectedTracks = expected.mediaTracks
      val actualTracks = actual.mediaTracks
      if (expectedTracks == null) {
        assertNull("[$name] mediaTracks", actualTracks)
      } else {
        assertEquals("[$name] mediaTracks count", expectedTracks.size, actualTracks?.size ?: 0)
        for (j in expectedTracks.indices) {
          val et = expectedTracks[j]
          val at = actualTracks?.get(j)
          assertEquals("[$name] mediaTracks[$j].id", et.id, at?.id)
          assertEquals("[$name] mediaTracks[$j].type", et.type, at?.type)
          assertEquals("[$name] mediaTracks[$j].contentId", et.contentId, at?.contentId)
          assertEquals("[$name] mediaTracks[$j].contentType", et.contentType, at?.contentType)
          assertEquals("[$name] mediaTracks[$j].language", et.language, at?.language)
          assertEquals("[$name] mediaTracks[$j].name", et.name, at?.name)
          ConverterAssertions.assertAnyMapEquals(at?.customData, et.customData, "[$name] mediaTracks[$j]")
        }
      }

      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun mediaInfoFromJson(json: JSONObject): MediaInfo {
    val tracksJson = if (json.has("mediaTracks")) json.getJSONArray("mediaTracks") else null
    val tracks: Array<MediaTrack>? = tracksJson?.let { arr ->
      Array(arr.length()) { i ->
        val t = arr.getJSONObject(i)
        MediaTrack(
          id = t.getDouble("id"),
          type = trackTypeFromString(t.optString("type", "audio")),
          contentId = t.optString("contentId").ifEmpty { null },
          contentType = t.optString("contentType").ifEmpty { null },
          language = t.optString("language").ifEmpty { null },
          name = t.optString("name").ifEmpty { null },
          subtype = null,
          customData = if (t.has("customData")) t.getJSONObject("customData").toAnyMap() else null
        )
      }
    }
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return MediaInfo(
      contentUrl = json.getString("contentUrl"),
      contentId = json.optString("contentId").ifEmpty { null },
      contentType = json.optString("contentType").ifEmpty { null },
      entity = json.optString("entity").ifEmpty { null },
      streamType = if (json.has("streamType")) streamTypeFromString(json.getString("streamType")) else null,
      metadata = null,
      streamDuration = if (json.has("streamDuration")) json.getDouble("streamDuration") else null,
      mediaTracks = tracks,
      textTrackStyle = null,
      hlsSegmentFormat = if (json.has("hlsSegmentFormat")) hlsSegmentFormatFromString(json.getString("hlsSegmentFormat")) else null,
      hlsVideoSegmentFormat = if (json.has("hlsVideoSegmentFormat")) hlsVideoSegmentFormatFromString(json.getString("hlsVideoSegmentFormat")) else null,
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun trackTypeFromString(s: String) = when (s) {
    "audio" -> com.margelo.nitro.googlecast.MediaTrackType.AUDIO
    "text" -> com.margelo.nitro.googlecast.MediaTrackType.TEXT
    "video" -> com.margelo.nitro.googlecast.MediaTrackType.VIDEO
    else -> com.margelo.nitro.googlecast.MediaTrackType.AUDIO
  }

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    "other" -> MediaStreamType.OTHER
    else -> MediaStreamType.OTHER
  }

  private fun hlsSegmentFormatFromString(s: String): MediaHlsSegmentFormat? = when (s) {
    "AAC" -> MediaHlsSegmentFormat.AAC
    "AC3" -> MediaHlsSegmentFormat.AC3
    "E_AC3" -> MediaHlsSegmentFormat.E_AC3
    "FMP4" -> MediaHlsSegmentFormat.FMP4
    "MP3" -> MediaHlsSegmentFormat.MP3
    "TS" -> MediaHlsSegmentFormat.TS
    "TS_AAC" -> MediaHlsSegmentFormat.TS_AAC
    else -> null
  }

  private fun hlsVideoSegmentFormatFromString(s: String): MediaHlsVideoSegmentFormat? = when (s) {
    "FMP4" -> MediaHlsVideoSegmentFormat.FMP4
    "MPEG2_TS" -> MediaHlsVideoSegmentFormat.MPEG2_TS
    else -> null
  }
}

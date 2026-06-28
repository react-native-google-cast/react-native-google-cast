package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.VideoHdrType
import com.margelo.nitro.googlecast.VideoInfo
import com.google.android.gms.cast.VideoInfo as GckVideoInfo
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the VideoInfo struct↔GCK converter (Android side of T1).
 *
 * Drives each fixture through `struct → GCK → struct` and asserts the result against
 * the corpus's `expectedRoundTrip`. GCK-side values are pinned using constant names, not
 * int literals, to catch symmetric mapping bugs.
 *
 * ANDROID DIVERGENCE — "minimal" fixture (null hdrType):
 *   null hdrType → GCK HDR_TYPE_UNKNOWN → null (else branch in reverse converter).
 *   The corpus expectedRoundTrip says "SDR" because iOS GCK defaults to SDR for a default-
 *   constructed GCKVideoInfo. On Android, HDR_TYPE_UNKNOWN round-trips to null, NOT SDR.
 *   The corpus is iOS-pinned and must not be changed. The hdrType assertion for "minimal"
 *   is Android-specific (asserts null); all other fields still match the corpus.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class VideoInfoConverterTest {

  private val hdrGckConst: Map<String, Int> = mapOf(
    "SDR" to GckVideoInfo.HDR_TYPE_SDR,
    "DV" to GckVideoInfo.HDR_TYPE_DV,
    "HDR" to GckVideoInfo.HDR_TYPE_HDR
  )

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = ConverterCorpus.load("videoInfo")
    require(fixtures.length() > 0) { "videoInfo corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = videoInfoFromJson(inputJson)
      val expected = videoInfoFromJson(expectedJson)

      val gck = input.toGckVideoInfo()

      // Pin GCK side by constant name (platform-specific int, not in corpus).
      if (inputJson.has("hdrType")) {
        val hdrName = inputJson.getString("hdrType")
        val expectedGck = checkNotNull(hdrGckConst[hdrName]) {
          "Unsupported hdrType fixture: $hdrName"
        }
        assertEquals("[$name] gck hdrType", expectedGck, gck.hdrType)
      }
      assertEquals("[$name] gck width", (input.width ?: 0.0).toInt(), gck.width)
      assertEquals("[$name] gck height", (input.height ?: 0.0).toInt(), gck.height)

      val actual = gck.toVideoInfo()

      // Width and height always match the corpus.
      assertEquals("[$name] width", expected.width, actual.width)
      assertEquals("[$name] height", expected.height, actual.height)

      // hdrType: Android diverges for the "minimal" fixture (no input hdrType).
      // null → HDR_TYPE_UNKNOWN → null (not "SDR" as iOS corpus expects).
      if (inputJson.has("hdrType")) {
        assertEquals("[$name] hdrType", expected.hdrType, actual.hdrType)
      } else {
        // Android-specific: null hdrType round-trips to null, not SDR.
        assertNull("[$name] hdrType (android: null hdrType round-trips to null, not SDR)", actual.hdrType)
      }
    }
  }

  private fun videoInfoFromJson(json: JSONObject): VideoInfo = VideoInfo(
    hdrType = if (json.has("hdrType")) hdrTypeFromString(json.getString("hdrType")) else null,
    width = if (json.has("width")) json.getDouble("width") else null,
    height = if (json.has("height")) json.getDouble("height") else null
  )

  private fun hdrTypeFromString(s: String): VideoHdrType = when (s) {
    "SDR" -> VideoHdrType.SDR
    "DV" -> VideoHdrType.DV
    "HDR" -> VideoHdrType.HDR
    else -> error("Unsupported hdrType fixture: $s")
  }
}

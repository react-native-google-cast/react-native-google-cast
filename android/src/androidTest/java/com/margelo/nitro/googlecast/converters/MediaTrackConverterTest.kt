package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaTrack
import com.margelo.nitro.googlecast.MediaTrackSubtype
import com.margelo.nitro.googlecast.MediaTrackType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaTrack struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: AnyMap (customData field) is JNI-backed
 * and cannot be constructed under Robolectric.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 * Run with: `./gradlew :react-native-google-cast:connectedDebugAndroidTest` once a device
 * is available.
 */
@RunWith(AndroidJUnit4::class)
class MediaTrackConverterTest {

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
    val fixtures = InstrumentedCorpus.load("mediaTrack")
    require(fixtures.length() > 0) { "mediaTrack corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = mediaTrackFromJson(inputJson)
      val expected = mediaTrackFromJson(expectedJson)

      val gck = input.toGckMediaTrack()
      val actual = gck.toMediaTrack()

      assertEquals("[$name] id", expected.id, actual.id, 1e-9)
      assertEquals("[$name] type", expected.type, actual.type)
      assertEquals("[$name] contentId", expected.contentId, actual.contentId)
      assertEquals("[$name] contentType", expected.contentType, actual.contentType)
      assertEquals("[$name] language", expected.language, actual.language)
      assertEquals("[$name] name", expected.name, actual.name)
      assertEquals("[$name] subtype", expected.subtype, actual.subtype)
      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun mediaTrackFromJson(json: JSONObject): MediaTrack {
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return MediaTrack(
      id = json.getDouble("id"),
      type = trackTypeFromString(json.optString("type", "audio")),
      contentId = json.optString("contentId").ifEmpty { null },
      contentType = json.optString("contentType").ifEmpty { null },
      language = json.optString("language").ifEmpty { null },
      name = json.optString("name").ifEmpty { null },
      subtype = if (json.has("subtype")) subtypeFromString(json.getString("subtype")) else null,
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun trackTypeFromString(s: String): MediaTrackType = when (s) {
    "audio" -> MediaTrackType.AUDIO
    "text" -> MediaTrackType.TEXT
    "video" -> MediaTrackType.VIDEO
    else -> error("Unsupported mediaTrack.type: $s")
  }

  private fun subtypeFromString(s: String): MediaTrackSubtype? = when (s) {
    "captions" -> MediaTrackSubtype.CAPTIONS
    "chapters" -> MediaTrackSubtype.CHAPTERS
    "descriptions" -> MediaTrackSubtype.DESCRIPTIONS
    "metadata" -> MediaTrackSubtype.METADATA
    "subtitles" -> MediaTrackSubtype.SUBTITLES
    else -> error("Unsupported mediaTrack.subtype: $s")
  }
}

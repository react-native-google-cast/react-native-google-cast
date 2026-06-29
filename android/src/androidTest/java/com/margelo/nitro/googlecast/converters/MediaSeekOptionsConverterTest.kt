package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaSeekOptions
import com.margelo.nitro.googlecast.MediaSeekResumeState
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaSeekOptions struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID DIVERGENCE — `relative` field:
 *   GCK Android has no counterpart for `relative`; the forward converter drops it and the
 *   reverse always returns `relative = null`. The corpus expectedRoundTrip for the "full"
 *   fixture has `relative: true` (iOS-pinned) — this assertion is Android-specific: null.
 *   Do NOT change the corpus; this is a known platform asymmetry.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaSeekOptionsConverterTest {

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
    val fixtures = InstrumentedCorpus.load("mediaSeekOptions")
    require(fixtures.length() > 0) { "mediaSeekOptions corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = seekOptionsFromJson(inputJson)
      val expected = seekOptionsFromJson(expectedJson)

      val gck = input.toGckMediaSeekOptions()
      val actual = gck.toMediaSeekOptions()

      assertEquals("[$name] position", expected.position, actual.position)
      assertEquals("[$name] infinite", expected.infinite, actual.infinite)
      assertEquals("[$name] resumeState", expected.resumeState, actual.resumeState)
      // Android-specific: `relative` has no GCK counterpart; always null after round-trip.
      assertNull("[$name] relative (android: no GCK counterpart, always null)", actual.relative)
      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun seekOptionsFromJson(json: JSONObject): MediaSeekOptions {
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return MediaSeekOptions(
      position = if (json.has("position")) json.getDouble("position") else null,
      relative = if (json.has("relative")) json.getBoolean("relative") else null,
      infinite = if (json.has("infinite")) json.getBoolean("infinite") else null,
      resumeState = if (json.has("resumeState")) resumeStateFromString(json.getString("resumeState")) else null,
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun resumeStateFromString(s: String): MediaSeekResumeState? = when (s) {
    "play" -> MediaSeekResumeState.PLAY
    "pause" -> MediaSeekResumeState.PAUSE
    else -> null
  }
}

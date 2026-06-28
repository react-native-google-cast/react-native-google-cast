package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import com.margelo.nitro.googlecast.TextTrackEdgeType
import com.margelo.nitro.googlecast.TextTrackFontGenericFamily
import com.margelo.nitro.googlecast.TextTrackFontStyle
import com.margelo.nitro.googlecast.TextTrackStyle
import com.margelo.nitro.googlecast.TextTrackWindowType
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for TextTrackStyle struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID NOTE — color handling:
 *   Colors are stored as CSS `#RRGGBBAA` strings in the struct, but Android's
 *   `Color.parseColor` treats 8-char hex as `#AARRGGBB` (alpha-first). The converter uses
 *   `Color.parseColor` (forward) and `String.format("#%08X", color)` (reverse), which are
 *   inverse operations for any 8-char hex string, so the hex round-trip is identity — the
 *   semantic color interpretation on Android differs from iOS but the corpus hex values are
 *   preserved. If color normalization in GCK produces different hex (e.g. RGB-only output),
 *   that will appear as a test failure and must be documented for reconciliation.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class TextTrackStyleConverterTest {

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
    val fixtures = InstrumentedCorpus.load("textTrackStyle")
    require(fixtures.length() > 0) { "textTrackStyle corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = textTrackStyleFromJson(inputJson)
      val expected = textTrackStyleFromJson(expectedJson)

      val gck = input.toGckTextTrackStyle()
      val actual = gck.toTextTrackStyle()

      assertEquals("[$name] backgroundColor", expected.backgroundColor, actual.backgroundColor)
      assertEquals("[$name] edgeColor", expected.edgeColor, actual.edgeColor)
      assertEquals("[$name] foregroundColor", expected.foregroundColor, actual.foregroundColor)
      assertEquals("[$name] windowColor", expected.windowColor, actual.windowColor)
      assertEquals("[$name] edgeType", expected.edgeType, actual.edgeType)
      assertEquals("[$name] fontFamily", expected.fontFamily, actual.fontFamily)
      assertEquals("[$name] fontGenericFamily", expected.fontGenericFamily, actual.fontGenericFamily)
      assertEquals("[$name] fontScale", expected.fontScale, actual.fontScale)
      assertEquals("[$name] fontStyle", expected.fontStyle, actual.fontStyle)
      assertEquals("[$name] windowCornerRadius", expected.windowCornerRadius, actual.windowCornerRadius)
      assertEquals("[$name] windowType", expected.windowType, actual.windowType)
      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun textTrackStyleFromJson(json: JSONObject): TextTrackStyle {
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return TextTrackStyle(
      backgroundColor = json.optString("backgroundColor").ifEmpty { null },
      edgeColor = json.optString("edgeColor").ifEmpty { null },
      edgeType = if (json.has("edgeType")) edgeTypeFromString(json.getString("edgeType")) else null,
      fontFamily = json.optString("fontFamily").ifEmpty { null },
      fontGenericFamily = if (json.has("fontGenericFamily")) fontGenericFamilyFromString(json.getString("fontGenericFamily")) else null,
      fontScale = if (json.has("fontScale")) json.getDouble("fontScale") else null,
      fontStyle = if (json.has("fontStyle")) fontStyleFromString(json.getString("fontStyle")) else null,
      foregroundColor = json.optString("foregroundColor").ifEmpty { null },
      windowColor = json.optString("windowColor").ifEmpty { null },
      windowCornerRadius = if (json.has("windowCornerRadius")) json.getDouble("windowCornerRadius") else null,
      windowType = if (json.has("windowType")) windowTypeFromString(json.getString("windowType")) else null,
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun edgeTypeFromString(s: String): TextTrackEdgeType? = when (s) {
    "depressed" -> TextTrackEdgeType.DEPRESSED
    "dropShadow" -> TextTrackEdgeType.DROPSHADOW
    "none" -> TextTrackEdgeType.NONE
    "outline" -> TextTrackEdgeType.OUTLINE
    "raised" -> TextTrackEdgeType.RAISED
    else -> null
  }

  private fun fontGenericFamilyFromString(s: String): TextTrackFontGenericFamily? = when (s) {
    "casual" -> TextTrackFontGenericFamily.CASUAL
    "cursive" -> TextTrackFontGenericFamily.CURSIVE
    "monoSansSerif" -> TextTrackFontGenericFamily.MONOSANSSERIF
    "monoSerif" -> TextTrackFontGenericFamily.MONOSERIF
    "sansSerif" -> TextTrackFontGenericFamily.SANSSERIF
    "serif" -> TextTrackFontGenericFamily.SERIF
    "smallCaps" -> TextTrackFontGenericFamily.SMALLCAPS
    else -> null
  }

  private fun fontStyleFromString(s: String): TextTrackFontStyle? = when (s) {
    "bold" -> TextTrackFontStyle.BOLD
    "boldItalic" -> TextTrackFontStyle.BOLDITALIC
    "italic" -> TextTrackFontStyle.ITALIC
    "normal" -> TextTrackFontStyle.NORMAL
    else -> null
  }

  private fun windowTypeFromString(s: String): TextTrackWindowType? = when (s) {
    "none" -> TextTrackWindowType.NONE
    "normal" -> TextTrackWindowType.NORMAL
    "rounded" -> TextTrackWindowType.ROUNDED
    else -> null
  }
}

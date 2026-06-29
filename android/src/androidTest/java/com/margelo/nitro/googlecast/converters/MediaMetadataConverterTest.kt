package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaMetadata
import com.margelo.nitro.googlecast.MediaMetadataType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import com.margelo.nitro.googlecast.WebImage
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaMetadata struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: AnyMap (customData) is JNI-backed.
 *
 * ANDROID DIVERGENCE — date fields:
 *   iOS GCK normalizes dates to ISO-8601 BASIC form (e.g. "2008-04-10T00:00:00Z" → "20080410").
 *   Android GCK uses `getDateAsString` which returns the same BASIC form, so date round-trip
 *   behavior should be identical — the corpus expectedRoundTrip values are BASIC dates.
 *   If Android produces different strings (timezone offset differences), those will appear
 *   as test failures and must be documented in the bead for reconciliation.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaMetadataConverterTest {

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
    val fixtures = InstrumentedCorpus.load("mediaMetadata")
    require(fixtures.length() > 0) { "mediaMetadata corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = mediaMetadataFromJson(inputJson)
      val expected = mediaMetadataFromJson(expectedJson)

      val gck = input.toGckMediaMetadata()
      val actual = gck.toMediaMetadata()

      assertEquals("[$name] type", expected.type, actual.type)
      assertEquals("[$name] title", expected.title, actual.title)
      assertEquals("[$name] subtitle", expected.subtitle, actual.subtitle)
      assertEquals("[$name] artist", expected.artist, actual.artist)
      assertEquals("[$name] studio", expected.studio, actual.studio)
      assertEquals("[$name] albumTitle", expected.albumTitle, actual.albumTitle)
      assertEquals("[$name] albumArtist", expected.albumArtist, actual.albumArtist)
      assertEquals("[$name] composer", expected.composer, actual.composer)
      assertEquals("[$name] releaseDate", expected.releaseDate, actual.releaseDate)
      assertEquals("[$name] creationDate", expected.creationDate, actual.creationDate)
      assertEquals("[$name] broadcastDate", expected.broadcastDate, actual.broadcastDate)
      assertEquals("[$name] discNumber", expected.discNumber, actual.discNumber)
      assertEquals("[$name] trackNumber", expected.trackNumber, actual.trackNumber)
      assertEquals("[$name] episodeNumber", expected.episodeNumber, actual.episodeNumber)
      assertEquals("[$name] seasonNumber", expected.seasonNumber, actual.seasonNumber)
      assertEquals("[$name] seriesTitle", expected.seriesTitle, actual.seriesTitle)
      assertEquals("[$name] location", expected.location, actual.location)
      assertEquals("[$name] latitude", expected.latitude, actual.latitude)
      assertEquals("[$name] longitude", expected.longitude, actual.longitude)
      assertEquals("[$name] width", expected.width, actual.width)
      assertEquals("[$name] height", expected.height, actual.height)

      val expectedImages = expected.images
      val actualImages = actual.images
      if (expectedImages == null) {
        assertNull("[$name] images", actualImages)
      } else {
        assertEquals("[$name] images count", expectedImages.size, actualImages?.size ?: 0)
        for (j in expectedImages.indices) {
          assertEquals("[$name] images[$j] url", expectedImages[j].url, actualImages?.get(j)?.url)
          // expectedRoundTrip pins image dimensions for every entry (GCK requires concrete
          // ints; absent dims normalize to 0), so both sides are always non-null here.
          assertEquals("[$name] images[$j] width", expectedImages[j].width, actualImages?.get(j)?.width)
          assertEquals("[$name] images[$j] height", expectedImages[j].height, actualImages?.get(j)?.height)
        }
      }

      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun mediaMetadataFromJson(json: JSONObject): MediaMetadata {
    val imagesJson = if (json.has("images")) json.getJSONArray("images") else null
    val images = imagesJson?.let { arr ->
      Array(arr.length()) { i ->
        val img = arr.getJSONObject(i)
        WebImage(
          url = img.getString("url"),
          width = if (img.has("width")) img.getDouble("width") else null,
          height = if (img.has("height")) img.getDouble("height") else null
        )
      }
    }
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    val typeStr = json.optString("type", "generic")
    return MediaMetadata(
      type = metadataTypeFromString(typeStr),
      images = images,
      title = json.optString("title").ifEmpty { null },
      subtitle = json.optString("subtitle").ifEmpty { null },
      artist = json.optString("artist").ifEmpty { null },
      releaseDate = json.optString("releaseDate").ifEmpty { null },
      studio = json.optString("studio").ifEmpty { null },
      albumTitle = json.optString("albumTitle").ifEmpty { null },
      albumArtist = json.optString("albumArtist").ifEmpty { null },
      composer = json.optString("composer").ifEmpty { null },
      discNumber = if (json.has("discNumber")) json.getDouble("discNumber") else null,
      trackNumber = if (json.has("trackNumber")) json.getDouble("trackNumber") else null,
      creationDate = json.optString("creationDate").ifEmpty { null },
      location = json.optString("location").ifEmpty { null },
      latitude = if (json.has("latitude")) json.getDouble("latitude") else null,
      longitude = if (json.has("longitude")) json.getDouble("longitude") else null,
      width = if (json.has("width")) json.getDouble("width") else null,
      height = if (json.has("height")) json.getDouble("height") else null,
      broadcastDate = json.optString("broadcastDate").ifEmpty { null },
      episodeNumber = if (json.has("episodeNumber")) json.getDouble("episodeNumber") else null,
      seasonNumber = if (json.has("seasonNumber")) json.getDouble("seasonNumber") else null,
      seriesTitle = json.optString("seriesTitle").ifEmpty { null },
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun metadataTypeFromString(s: String): MediaMetadataType = when (s) {
    "generic" -> MediaMetadataType.GENERIC
    "movie" -> MediaMetadataType.MOVIE
    "musicTrack" -> MediaMetadataType.MUSICTRACK
    "photo" -> MediaMetadataType.PHOTO
    "tvShow" -> MediaMetadataType.TVSHOW
    "user" -> MediaMetadataType.USER
    else -> MediaMetadataType.GENERIC
  }
}

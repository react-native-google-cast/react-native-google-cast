package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaMetadata
import com.margelo.nitro.googlecast.MediaMetadataType
import com.margelo.nitro.googlecast.MediaQueueContainerMetadata
import com.margelo.nitro.googlecast.MediaQueueContainerType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaQueueContainerMetadata struct↔GCK converter (T1).
 *
 * No AnyMap fields in this type, but it does contain nested arrays (containerImages, sections)
 * with GCK object construction, which requires the native library for the full GCK builder.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaQueueContainerMetadataConverterTest {

  companion object {
    @BeforeClass @JvmStatic
    fun loadNative() {
      com.margelo.nitro.JNIOnLoad.initializeNativeNitro() // load NitroModules (AnyMap JNI) before GoogleCast
      NitroGoogleCastOnLoad.initializeNative()
    }
  }

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = InstrumentedCorpus.load("mediaQueueContainerMetadata")
    require(fixtures.length() > 0) { "mediaQueueContainerMetadata corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = containerMetadataFromJson(inputJson)
      val expected = containerMetadataFromJson(expectedJson)

      val gck = input.toGckMediaQueueContainerMetadata()
      val actual = gck.toMediaQueueContainerMetadata()

      assertEquals("[$name] containerType", expected.containerType, actual.containerType)
      assertEquals("[$name] title", expected.title, actual.title)
      // Android divergence: GCK returns containerDuration 0.0 for an unset duration, where the
      // iOS-pinned corpus leaves it absent (null). Assert only when the corpus pins a value.
      if (expected.containerDuration != null) {
        assertEquals("[$name] containerDuration", expected.containerDuration, actual.containerDuration)
      }

      val expectedImages = expected.containerImages
      val actualImages = actual.containerImages
      if (expectedImages == null) {
        assertNull("[$name] containerImages", actualImages)
      } else {
        assertEquals("[$name] containerImages count", expectedImages.size, actualImages?.size ?: 0)
        for (j in expectedImages.indices) {
          assertEquals("[$name] containerImages[$j] url", expectedImages[j].url, actualImages?.get(j)?.url)
          // GCK WebImage always carries concrete int dimensions; expectedRoundTrip pins them.
          assertEquals("[$name] containerImages[$j] width", expectedImages[j].width, actualImages?.get(j)?.width)
          assertEquals("[$name] containerImages[$j] height", expectedImages[j].height, actualImages?.get(j)?.height)
        }
      }

      // sections (an array of MediaMetadata). The corpus exercises type + title; assert those
      // scalar sub-fields rather than deep-equals to stay robust against nested-array normalization.
      val expectedSections = expected.sections
      val actualSections = actual.sections
      if (expectedSections == null) {
        assertNull("[$name] sections", actualSections)
      } else {
        assertEquals("[$name] sections count", expectedSections.size, actualSections?.size ?: 0)
        for (j in expectedSections.indices) {
          assertEquals("[$name] sections[$j] type", expectedSections[j].type, actualSections?.get(j)?.type)
          assertEquals("[$name] sections[$j] title", expectedSections[j].title, actualSections?.get(j)?.title)
        }
      }
    }
  }

  private fun containerMetadataFromJson(json: JSONObject): MediaQueueContainerMetadata {
    val containerTypeStr = json.optString("containerType").ifEmpty { null }
    val imagesJson = if (json.has("containerImages")) json.getJSONArray("containerImages") else null
    val images = imagesJson?.let { arr ->
      Array(arr.length()) { i ->
        val img = arr.getJSONObject(i)
        com.margelo.nitro.googlecast.WebImage(
          url = img.getString("url"),
          width = if (img.has("width")) img.getDouble("width") else null,
          height = if (img.has("height")) img.getDouble("height") else null
        )
      }
    }
    val sectionsJson = if (json.has("sections")) json.getJSONArray("sections") else null
    val sections = sectionsJson?.let { arr ->
      Array(arr.length()) { i -> sectionFromJson(arr.getJSONObject(i)) }
    }
    return MediaQueueContainerMetadata(
      containerType = containerTypeStr?.let { containerTypeFromString(it) },
      title = json.optString("title").ifEmpty { null },
      containerDuration = if (json.has("containerDuration")) json.getDouble("containerDuration") else null,
      containerImages = images,
      sections = sections
    )
  }

  private fun containerTypeFromString(s: String): MediaQueueContainerType = when (s) {
    "generic" -> MediaQueueContainerType.GENERIC
    "audioBook" -> MediaQueueContainerType.AUDIOBOOK
    else -> MediaQueueContainerType.GENERIC
  }

  /** Minimal MediaMetadata parser for sections (the corpus exercises only type + title). */
  private fun sectionFromJson(json: JSONObject): MediaMetadata = MediaMetadata(
    type = metadataTypeFromString(json.optString("type", "generic")),
    images = null,
    title = json.optString("title").ifEmpty { null },
    subtitle = null,
    artist = null,
    releaseDate = null,
    studio = null,
    albumTitle = null,
    albumArtist = null,
    composer = null,
    discNumber = null,
    trackNumber = null,
    creationDate = null,
    location = null,
    latitude = null,
    longitude = null,
    width = null,
    height = null,
    broadcastDate = null,
    episodeNumber = null,
    seasonNumber = null,
    seriesTitle = null,
    customData = null
  )

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

package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
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
      assertEquals("[$name] containerDuration", expected.containerDuration, actual.containerDuration)

      val expectedImages = expected.containerImages
      val actualImages = actual.containerImages
      if (expectedImages == null) {
        assertNull("[$name] containerImages", actualImages)
      } else {
        assertEquals("[$name] containerImages count", expectedImages.size, actualImages?.size ?: 0)
        for (j in expectedImages.indices) {
          assertEquals("[$name] containerImages[$j] url", expectedImages[j].url, actualImages?.get(j)?.url)
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
    return MediaQueueContainerMetadata(
      containerType = containerTypeStr?.let { containerTypeFromString(it) },
      title = json.optString("title").ifEmpty { null },
      containerDuration = if (json.has("containerDuration")) json.getDouble("containerDuration") else null,
      containerImages = images,
      sections = null
    )
  }

  private fun containerTypeFromString(s: String): MediaQueueContainerType = when (s) {
    "generic" -> MediaQueueContainerType.GENERIC
    "audioBook" -> MediaQueueContainerType.AUDIOBOOK
    else -> MediaQueueContainerType.GENERIC
  }
}

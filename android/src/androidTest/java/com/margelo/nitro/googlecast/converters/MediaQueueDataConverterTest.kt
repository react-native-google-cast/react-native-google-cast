package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaQueueContainerMetadata
import com.margelo.nitro.googlecast.MediaQueueContainerType
import com.margelo.nitro.googlecast.MediaQueueData
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaQueueType
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaQueueData struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: nested AnyMap types are JNI-backed.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaQueueDataConverterTest {

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
    val fixtures = InstrumentedCorpus.load("mediaQueueData")
    require(fixtures.length() > 0) { "mediaQueueData corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = queueDataFromJson(inputJson)
      val expected = queueDataFromJson(expectedJson)

      val gck = input.toGckMediaQueueData()
      val actual = gck.toMediaQueueData()

      assertEquals("[$name] type", expected.type, actual.type)
      // Android divergence: GCK returns REPEAT_MODE_OFF for an unset repeat mode, where the
      // iOS-pinned corpus leaves it absent (null). OFF is a legitimate explicit value, so the
      // converter faithfully maps OFF->OFF; assert only when the corpus pins a value.
      if (expected.repeatMode != null) {
        assertEquals("[$name] repeatMode", expected.repeatMode, actual.repeatMode)
      }
      assertEquals("[$name] startIndex", expected.startIndex, actual.startIndex)
      assertEquals("[$name] id", expected.id, actual.id)
      assertEquals("[$name] name", expected.name, actual.name)
      assertEquals("[$name] entity", expected.entity, actual.entity)

      // queue startTime: guard on non-null. GCK seconds = ms/1000; the "minimal" fixture leaves
      // startTime unset, where Android emits 0.0 (primitive) but the corpus pins it absent (an
      // Android divergence the corpus doesn't model), so only assert where the corpus pins a value.
      if (expected.startTime != null) {
        assertEquals("[$name] startTime", expected.startTime, actual.startTime)
      }

      // containerMetadata: assert presence + scalar sub-fields (parsed minimally; corpus has
      // containerType + title only). MediaQueueContainerMetadataConverterTest covers the full surface.
      val expectedContainer = expected.containerMetadata
      val actualContainer = actual.containerMetadata
      if (expectedContainer == null) {
        assertNull("[$name] containerMetadata", actualContainer)
      } else {
        assertEquals("[$name] containerMetadata.containerType",
          expectedContainer.containerType, actualContainer?.containerType)
        assertEquals("[$name] containerMetadata.title",
          expectedContainer.title, actualContainer?.title)
      }

      val expectedItems = expected.items
      val actualItems = actual.items
      if (expectedItems != null && expectedItems.isNotEmpty()) {
        assertEquals("[$name] items count", expectedItems.size, actualItems?.size ?: 0)
        for (j in expectedItems.indices) {
          assertEquals("[$name] items[$j].mediaInfo.contentUrl",
            expectedItems[j].mediaInfo?.contentUrl, actualItems?.get(j)?.mediaInfo?.contentUrl)
          assertEquals("[$name] items[$j].autoplay",
            expectedItems[j].autoplay, actualItems?.get(j)?.autoplay)
        }
      }
    }
  }

  private fun queueDataFromJson(json: JSONObject): MediaQueueData {
    val itemsJson = if (json.has("items")) json.getJSONArray("items") else null
    val items: Array<MediaQueueItem>? = itemsJson?.let { arr ->
      Array(arr.length()) { i ->
        val item = arr.getJSONObject(i)
        val mediaJson = item.getJSONObject("mediaInfo")
        MediaQueueItem(
          mediaInfo = MediaInfo(
            contentUrl = mediaJson.getString("contentUrl"),
            contentId = null, contentType = null, entity = null,
            streamType = if (mediaJson.has("streamType")) streamTypeFromString(mediaJson.getString("streamType")) else null,
            metadata = null,
            streamDuration = if (mediaJson.has("streamDuration")) mediaJson.getDouble("streamDuration") else null,
            mediaTracks = null, textTrackStyle = null,
            hlsSegmentFormat = null, hlsVideoSegmentFormat = null, customData = null
          ),
          itemId = null,
          activeTrackIds = null,
          autoplay = if (item.has("autoplay")) item.getBoolean("autoplay") else null,
          playbackDuration = null,
          preloadTime = if (item.has("preloadTime")) item.getDouble("preloadTime") else null,
          startTime = null,
          customData = null
        )
      }
    }
    return MediaQueueData(
      id = json.optString("id").ifEmpty { null },
      name = json.optString("name").ifEmpty { null },
      entity = json.optString("entity").ifEmpty { null },
      type = if (json.has("type")) queueTypeFromString(json.getString("type")) else null,
      repeatMode = if (json.has("repeatMode")) repeatModeFromString(json.getString("repeatMode")) else null,
      containerMetadata = if (json.has("containerMetadata")) containerMetadataFromJson(json.getJSONObject("containerMetadata")) else null,
      items = items,
      startIndex = if (json.has("startIndex")) json.getDouble("startIndex") else null,
      startTime = if (json.has("startTime")) json.getDouble("startTime") else null
    )
  }

  private fun queueTypeFromString(s: String): MediaQueueType = when (s) {
    "album" -> MediaQueueType.ALBUM
    "audioBook" -> MediaQueueType.AUDIOBOOK
    "liveTv" -> MediaQueueType.LIVETV
    "movie" -> MediaQueueType.MOVIE
    "playlist" -> MediaQueueType.PLAYLIST
    "podcastSeries" -> MediaQueueType.PODCASTSERIES
    "radioStation" -> MediaQueueType.RADIOSTATION
    "tvSeries" -> MediaQueueType.TVSERIES
    "videoPlaylist" -> MediaQueueType.VIDEOPLAYLIST
    else -> MediaQueueType.ALBUM
  }

  /** Minimal container parser; the corpus exercises containerType + title only. */
  private fun containerMetadataFromJson(json: JSONObject): MediaQueueContainerMetadata =
    MediaQueueContainerMetadata(
      containerType = if (json.has("containerType")) containerTypeFromString(json.getString("containerType")) else null,
      title = json.optString("title").ifEmpty { null },
      containerDuration = if (json.has("containerDuration")) json.getDouble("containerDuration") else null,
      containerImages = null,
      sections = null
    )

  private fun containerTypeFromString(s: String): MediaQueueContainerType = when (s) {
    "generic" -> MediaQueueContainerType.GENERIC
    "audioBook" -> MediaQueueContainerType.AUDIOBOOK
    else -> MediaQueueContainerType.GENERIC
  }

  private fun repeatModeFromString(s: String): MediaRepeatMode = when (s) {
    "all" -> MediaRepeatMode.ALL
    "allAndShuffle" -> MediaRepeatMode.ALLANDSHUFFLE
    "off" -> MediaRepeatMode.OFF
    "single" -> MediaRepeatMode.SINGLE
    else -> MediaRepeatMode.OFF
  }

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    else -> MediaStreamType.OTHER
  }
}

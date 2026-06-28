package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaQueueData
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaQueueType
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
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
      assertEquals("[$name] repeatMode", expected.repeatMode, actual.repeatMode)
      assertEquals("[$name] startIndex", expected.startIndex, actual.startIndex)
      assertEquals("[$name] id", expected.id, actual.id)
      assertEquals("[$name] name", expected.name, actual.name)
      assertEquals("[$name] entity", expected.entity, actual.entity)

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
      containerMetadata = null,
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

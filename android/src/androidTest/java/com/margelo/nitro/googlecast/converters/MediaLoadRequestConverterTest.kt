package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaLoadRequest
import com.margelo.nitro.googlecast.MediaQueueData
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaQueueType
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaLoadRequest struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID DIVERGENCE — `autoplay` and `playbackRate` defaults:
 *   GCK always emits autoplay (non-optional primitive). The corpus "minimal" expectedRoundTrip
 *   has `autoplay: true` (GCK Android builder default). `playbackRate` is always emitted as
 *   a primitive (default 1.0); the corpus "minimal" has `playbackRate: 1`.
 *   `startTime` absent → PLAY_POSITION_UNASSIGNED sentinel → null on reverse.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaLoadRequestConverterTest {

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
    val fixtures = InstrumentedCorpus.load("mediaLoadRequest")
    require(fixtures.length() > 0) { "mediaLoadRequest corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = loadRequestFromJson(inputJson)
      val expected = loadRequestFromJson(expectedJson)

      val gck = input.toGckMediaLoadRequestData()
      val actual = gck.toMediaLoadRequest()

      assertEquals("[$name] autoplay", expected.autoplay, actual.autoplay)
      assertEquals("[$name] startTime", expected.startTime, actual.startTime)
      assertEquals("[$name] playbackRate", expected.playbackRate, actual.playbackRate)
      assertEquals("[$name] credentials", expected.credentials, actual.credentials)
      assertEquals("[$name] credentialsType", expected.credentialsType, actual.credentialsType)
      if (expected.mediaInfo != null) {
        assertEquals("[$name] mediaInfo.contentUrl", expected.mediaInfo?.contentUrl, actual.mediaInfo?.contentUrl)
      }

      // queueData round-trip (exercised by the "queue-load" fixture). Item-level checks
      // mirror MediaQueueDataConverterTest's proven assertions (contentUrl + autoplay).
      val expectedQueue = expected.queueData
      val actualQueue = actual.queueData
      if (expectedQueue == null) {
        assertNull("[$name] queueData", actualQueue)
      } else {
        assertEquals("[$name] queueData.type", expectedQueue.type, actualQueue?.type)
        assertEquals("[$name] queueData.startIndex", expectedQueue.startIndex, actualQueue?.startIndex)
        val expectedItems = expectedQueue.items
        val actualItems = actualQueue?.items
        if (expectedItems == null) {
          assertNull("[$name] queueData.items", actualItems)
        } else {
          assertEquals("[$name] queueData.items count", expectedItems.size, actualItems?.size ?: 0)
          for (j in expectedItems.indices) {
            assertEquals("[$name] queueData.items[$j].mediaInfo.contentUrl",
              expectedItems[j].mediaInfo?.contentUrl, actualItems?.get(j)?.mediaInfo?.contentUrl)
            assertEquals("[$name] queueData.items[$j].autoplay",
              expectedItems[j].autoplay, actualItems?.get(j)?.autoplay)
          }
        }
      }

      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun loadRequestFromJson(json: JSONObject): MediaLoadRequest {
    val mediaJson = if (json.has("mediaInfo")) json.getJSONObject("mediaInfo") else null
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    return MediaLoadRequest(
      mediaInfo = mediaJson?.let { mediaInfoFromJson(it) },
      queueData = if (json.has("queueData")) queueDataFromJson(json.getJSONObject("queueData")) else null,
      autoplay = if (json.has("autoplay")) json.getBoolean("autoplay") else null,
      startTime = if (json.has("startTime")) json.getDouble("startTime") else null,
      playbackRate = if (json.has("playbackRate")) json.getDouble("playbackRate") else null,
      credentials = json.optString("credentials").ifEmpty { null },
      credentialsType = json.optString("credentialsType").ifEmpty { null },
      customData = customDataJson?.toAnyMap()
    )
  }

  private fun mediaInfoFromJson(json: JSONObject): MediaInfo = MediaInfo(
    contentUrl = json.getString("contentUrl"),
    contentId = null, contentType = null, entity = null,
    streamType = if (json.has("streamType")) streamTypeFromString(json.getString("streamType")) else null,
    metadata = null,
    streamDuration = if (json.has("streamDuration")) json.getDouble("streamDuration") else null,
    mediaTracks = null, textTrackStyle = null,
    hlsSegmentFormat = null, hlsVideoSegmentFormat = null, customData = null
  )

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    else -> MediaStreamType.OTHER
  }

  private fun queueDataFromJson(json: JSONObject): MediaQueueData {
    val itemsJson = if (json.has("items")) json.getJSONArray("items") else null
    val items: Array<MediaQueueItem>? = itemsJson?.let { arr ->
      Array(arr.length()) { i ->
        val item = arr.getJSONObject(i)
        MediaQueueItem(
          mediaInfo = mediaInfoFromJson(item.getJSONObject("mediaInfo")),
          itemId = if (item.has("itemId")) item.getDouble("itemId") else null,
          activeTrackIds = null,
          autoplay = if (item.has("autoplay")) item.getBoolean("autoplay") else null,
          playbackDuration = if (item.has("playbackDuration")) item.getDouble("playbackDuration") else null,
          preloadTime = if (item.has("preloadTime")) item.getDouble("preloadTime") else null,
          startTime = if (item.has("startTime")) item.getDouble("startTime") else null,
          customData = if (item.has("customData")) item.getJSONObject("customData").toAnyMap() else null
        )
      }
    }
    return MediaQueueData(
      id = json.optString("id").ifEmpty { null },
      name = json.optString("name").ifEmpty { null },
      entity = json.optString("entity").ifEmpty { null },
      type = if (json.has("type")) queueTypeFromString(json.getString("type")) else null,
      repeatMode = null,
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
    else -> error("Unsupported queueData.type: $s")
  }
}

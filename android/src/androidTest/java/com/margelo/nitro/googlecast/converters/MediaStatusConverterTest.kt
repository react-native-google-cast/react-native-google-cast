package com.margelo.nitro.googlecast.converters

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaPlayerIdleReason
import com.margelo.nitro.googlecast.MediaPlayerState
import com.margelo.nitro.googlecast.MediaQueueItem
import com.margelo.nitro.googlecast.MediaRepeatMode
import com.margelo.nitro.googlecast.MediaStatus
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.NitroGoogleCastOnLoad
import com.margelo.nitro.googlecast.VideoHdrType
import com.margelo.nitro.googlecast.VideoInfo
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented parity test for MediaStatus struct↔GCK converter (Android side of T1).
 *
 * Requires a connected emulator or device: customData AnyMap is JNI-backed.
 *
 * ANDROID NOTE — `playerState`:
 *   Nitro generates `playerState` as optional (matching GCK's PLAYER_STATE_UNKNOWN → null).
 *   The corpus "playing" fixture has `playerState: "playing"` — verifies PLAYING round-trip.
 *   The corpus "idle" fixture has `playerState: "idle"` — verifies IDLE round-trip.
 *
 * NOTE: blocked on emulator (emulator-5554 was offline at time of authoring — 2026-06-28).
 */
@RunWith(AndroidJUnit4::class)
class MediaStatusConverterTest {

  companion object {
    @BeforeClass @JvmStatic
    fun loadNative() {
      NitroGoogleCastOnLoad.initializeNative()
    }
  }

  @Test
  fun roundTripsAllFixtures() {
    val fixtures = InstrumentedCorpus.load("mediaStatus")
    require(fixtures.length() > 0) { "mediaStatus corpus is empty" }

    for (i in 0 until fixtures.length()) {
      val fixture = fixtures.getJSONObject(i)
      val name = fixture.getString("name")
      val inputJson = fixture.getJSONObject("input")
      val expectedJson = fixture.getJSONObject("expectedRoundTrip")

      val input = mediaStatusFromJson(inputJson)
      val expected = mediaStatusFromJson(expectedJson)

      val gck = input.toGckMediaStatus()
      val actual = gck.toMediaStatus()

      assertEquals("[$name] playerState", expected.playerState, actual.playerState)
      assertEquals("[$name] idleReason", expected.idleReason, actual.idleReason)
      assertEquals("[$name] streamPosition", expected.streamPosition, actual.streamPosition, 1e-9)
      assertEquals("[$name] playbackRate", expected.playbackRate, actual.playbackRate, 1e-9)
      assertEquals("[$name] volume", expected.volume, actual.volume, 1e-9)
      assertEquals("[$name] isMuted", expected.isMuted, actual.isMuted)
      assertEquals("[$name] queueRepeatMode", expected.queueRepeatMode, actual.queueRepeatMode)
      if (expected.mediaInfo != null) {
        assertEquals("[$name] mediaInfo.contentUrl", expected.mediaInfo?.contentUrl, actual.mediaInfo?.contentUrl)
        assertEquals("[$name] mediaInfo.streamType", expected.mediaInfo?.streamType, actual.mediaInfo?.streamType)
      }

      // Nested state pinned by the corpus: "playing" → activeTrackIds + videoInfo;
      // "with-queue-and-live" → liveSeekableRange + queueItems + currentItemId.
      assertEquals("[$name] activeTrackIds", expected.activeTrackIds?.toList(), actual.activeTrackIds?.toList())

      if (expected.videoInfo != null) {
        assertEquals("[$name] videoInfo.hdrType", expected.videoInfo?.hdrType, actual.videoInfo?.hdrType)
        assertEquals("[$name] videoInfo.width", expected.videoInfo?.width, actual.videoInfo?.width)
        assertEquals("[$name] videoInfo.height", expected.videoInfo?.height, actual.videoInfo?.height)
      }

      if (expected.liveSeekableRange != null) {
        assertEquals("[$name] liveSeekableRange.startTime",
          expected.liveSeekableRange?.startTime, actual.liveSeekableRange?.startTime)
        assertEquals("[$name] liveSeekableRange.endTime",
          expected.liveSeekableRange?.endTime, actual.liveSeekableRange?.endTime)
        assertEquals("[$name] liveSeekableRange.isMovingWindow",
          expected.liveSeekableRange?.isMovingWindow, actual.liveSeekableRange?.isMovingWindow)
        assertEquals("[$name] liveSeekableRange.isLiveDone",
          expected.liveSeekableRange?.isLiveDone, actual.liveSeekableRange?.isLiveDone)
      }

      assertEquals("[$name] currentItemId", expected.currentItemId, actual.currentItemId)

      // queueItems: count + proven per-item fields. Per-item itemId/startTime/customData are
      // not pinned by the corpus and would need fixture expansion (deferred).
      assertEquals("[$name] queueItems count", expected.queueItems.size, actual.queueItems.size)
      for (j in expected.queueItems.indices) {
        assertEquals("[$name] queueItems[$j].mediaInfo.contentUrl",
          expected.queueItems[j].mediaInfo?.contentUrl, actual.queueItems[j].mediaInfo?.contentUrl)
        assertEquals("[$name] queueItems[$j].autoplay",
          expected.queueItems[j].autoplay, actual.queueItems[j].autoplay)
      }

      ConverterAssertions.assertAnyMapEquals(actual.customData, expected.customData, "[$name]")
    }
  }

  private fun mediaStatusFromJson(json: JSONObject): MediaStatus {
    val mediaJson = if (json.has("mediaInfo")) json.getJSONObject("mediaInfo") else null
    val videoInfoJson = if (json.has("videoInfo")) json.getJSONObject("videoInfo") else null
    val liveRangeJson = if (json.has("liveSeekableRange")) json.getJSONObject("liveSeekableRange") else null
    val trackIds = if (json.has("activeTrackIds")) {
      val arr = json.getJSONArray("activeTrackIds")
      DoubleArray(arr.length()) { i -> arr.getDouble(i) }
    } else null
    val customDataJson = if (json.has("customData")) json.getJSONObject("customData") else null
    val queueItemsJson = if (json.has("queueItems")) json.getJSONArray("queueItems") else null
    val queueItems = queueItemsJson?.let { arr ->
      Array(arr.length()) { i ->
        val item = arr.getJSONObject(i)
        val mJson = item.getJSONObject("mediaInfo")
        MediaQueueItem(
          mediaInfo = mediaInfoFromJson(mJson),
          itemId = null, activeTrackIds = null,
          autoplay = if (item.has("autoplay")) item.getBoolean("autoplay") else null,
          playbackDuration = null,
          preloadTime = if (item.has("preloadTime")) item.getDouble("preloadTime") else null,
          startTime = null, customData = null
        )
      }
    } ?: emptyArray()
    return MediaStatus(
      mediaInfo = mediaJson?.let { mediaInfoFromJson(it) },
      playerState = if (json.has("playerState")) playerStateFromString(json.getString("playerState")) else null,
      idleReason = if (json.has("idleReason")) idleReasonFromString(json.getString("idleReason")) else null,
      streamPosition = json.optDouble("streamPosition", 0.0),
      playbackRate = json.optDouble("playbackRate", 0.0),
      volume = json.optDouble("volume", 0.0),
      isMuted = json.optBoolean("isMuted", false),
      activeTrackIds = trackIds,
      videoInfo = videoInfoJson?.let { videoInfoFromJson(it) },
      liveSeekableRange = liveRangeJson?.let {
        com.margelo.nitro.googlecast.MediaLiveSeekableRange(
          startTime = it.getDouble("startTime"),
          endTime = it.getDouble("endTime"),
          isMovingWindow = it.getBoolean("isMovingWindow"),
          isLiveDone = it.getBoolean("isLiveDone")
        )
      },
      queueItems = queueItems,
      currentItemId = if (json.has("currentItemId")) json.getDouble("currentItemId") else null,
      loadingItemId = null,
      preloadedItemId = null,
      queueRepeatMode = if (json.has("queueRepeatMode")) repeatModeFromString(json.getString("queueRepeatMode")) else null,
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

  private fun videoInfoFromJson(json: JSONObject): VideoInfo = VideoInfo(
    hdrType = if (json.has("hdrType")) hdrTypeFromString(json.getString("hdrType")) else null,
    width = if (json.has("width")) json.getDouble("width") else null,
    height = if (json.has("height")) json.getDouble("height") else null
  )

  private fun hdrTypeFromString(s: String): VideoHdrType? = when (s) {
    "SDR" -> VideoHdrType.SDR
    "DV" -> VideoHdrType.DV
    "HDR" -> VideoHdrType.HDR
    else -> null
  }

  private fun streamTypeFromString(s: String): MediaStreamType = when (s) {
    "buffered" -> MediaStreamType.BUFFERED
    "live" -> MediaStreamType.LIVE
    else -> MediaStreamType.OTHER
  }

  private fun playerStateFromString(s: String): MediaPlayerState? = when (s) {
    "buffering" -> MediaPlayerState.BUFFERING
    "idle" -> MediaPlayerState.IDLE
    "loading" -> MediaPlayerState.LOADING
    "paused" -> MediaPlayerState.PAUSED
    "playing" -> MediaPlayerState.PLAYING
    else -> null
  }

  private fun idleReasonFromString(s: String): MediaPlayerIdleReason? = when (s) {
    "cancelled" -> MediaPlayerIdleReason.CANCELLED
    "error" -> MediaPlayerIdleReason.ERROR
    "finished" -> MediaPlayerIdleReason.FINISHED
    "interrupted" -> MediaPlayerIdleReason.INTERRUPTED
    else -> null
  }

  private fun repeatModeFromString(s: String): MediaRepeatMode? = when (s) {
    "all" -> MediaRepeatMode.ALL
    "allAndShuffle" -> MediaRepeatMode.ALLANDSHUFFLE
    "off" -> MediaRepeatMode.OFF
    "single" -> MediaRepeatMode.SINGLE
    else -> null
  }
}

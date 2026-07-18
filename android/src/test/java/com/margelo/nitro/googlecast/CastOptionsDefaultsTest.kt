package com.margelo.nitro.googlecast

import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.cast.framework.media.MediaIntentReceiver
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Vector-driven suite for the pure Decision-3/4 heuristics (E3): every
 * `pickImage` and `notificationActionsFor` vector in
 * `fixtures/cast-options/heuristics.json`, with the symbolic surfaces, action
 * names, and media types mapped to the GCK constants. Surfaces Android cannot
 * represent (`custom`, iOS-only) are skipped by this loader, per the corpus
 * contract. Plain JUnit — the heuristics are pure JVM logic.
 */
class CastOptionsDefaultsTest {

  // Symbolic surface → ImagePicker hint type. `custom` is iOS-only
  // (GCKMediaMetadataImageTypeCustom has no ImagePicker constant) — skipped.
  private val imageTypeBySurface = mapOf(
    "castDialog" to ImagePicker.IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND,
    "background" to ImagePicker.IMAGE_TYPE_EXPANDED_CONTROLLER_BACKGROUND,
    "miniController" to ImagePicker.IMAGE_TYPE_MINI_CONTROLLER_THUMBNAIL,
    "notificationThumbnail" to ImagePicker.IMAGE_TYPE_NOTIFICATION_THUMBNAIL,
    "lockScreenBackground" to ImagePicker.IMAGE_TYPE_LOCK_SCREEN_BACKGROUND,
  )
  private val iosOnlySurfaces = setOf("custom")

  private val actionByName = mapOf(
    "REWIND" to MediaIntentReceiver.ACTION_REWIND,
    "FORWARD" to MediaIntentReceiver.ACTION_FORWARD,
    "SKIP_PREV" to MediaIntentReceiver.ACTION_SKIP_PREV,
    "SKIP_NEXT" to MediaIntentReceiver.ACTION_SKIP_NEXT,
    "TOGGLE_PLAYBACK" to MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
    "STOP_CASTING" to MediaIntentReceiver.ACTION_STOP_CASTING,
  )

  private val mediaTypeByName = mapOf(
    "generic" to MediaMetadata.MEDIA_TYPE_GENERIC,
    "movie" to MediaMetadata.MEDIA_TYPE_MOVIE,
    "photo" to MediaMetadata.MEDIA_TYPE_PHOTO,
  )

  @Test
  fun pickImageMatchesEveryVector() {
    val vectors = CastOptionsCorpus.load().getJSONArray("pickImage")
    assertTrue("pickImage corpus is empty", vectors.length() > 0)

    var covered = 0
    for (i in 0 until vectors.length()) {
      val vector = vectors.getJSONObject(i)
      val surface = vector.getString("surface")
      val hintType = imageTypeBySurface[surface]
      if (hintType == null) {
        // Every skipped surface must be a known iOS-only one — an unknown
        // surface means loader/corpus drift, not a skippable vector.
        assertTrue("unmapped surface '$surface' is not a known iOS-only surface",
          surface in iosOnlySurfaces)
        continue
      }
      covered++

      val imageCount = vector.getInt("imageCount")
      val expectedIndex = if (vector.isNull("expectedIndex")) null else vector.getInt("expectedIndex")
      assertEquals(
        "[$surface imageCount=$imageCount]",
        expectedIndex,
        CastOptionsDefaults.pickImageIndex(imageCount, hintType)
      )
    }
    assertTrue("no Android-representable pickImage vector ran", covered > 0)
  }

  @Test
  fun notificationActionsMatchEveryVector() {
    val vectors = CastOptionsCorpus.load().getJSONArray("notificationActions")
    assertTrue("notificationActions corpus is empty", vectors.length() > 0)

    for (i in 0 until vectors.length()) {
      val vector = vectors.getJSONObject(i)
      val queueItemCount = vector.getInt("queueItemCount")
      val mediaType =
        if (vector.isNull("mediaType")) null
        else mediaTypeByName.getValue(vector.getString("mediaType"))
      val expectedActions = vector.getJSONArray("actions").let { array ->
        List(array.length()) { actionByName.getValue(array.getString(it)) }
      }
      val expectedCompact = vector.getJSONArray("compactViewIndices").let { array ->
        IntArray(array.length()) { array.getInt(it) }
      }

      val spec = CastOptionsDefaults.notificationActionsFor(queueItemCount, mediaType)
      val label = "[queueItemCount=$queueItemCount mediaType=${vector.optString("mediaType", "null")}]"
      assertEquals("$label actions", expectedActions, spec.actions)
      assertArrayEquals("$label compactViewIndices", expectedCompact, spec.compactViewIndices)
    }
  }

  // Boundary pins beyond the corpus (plan Task 7 Step 5).

  @Test
  fun singleQueueItemIsNotAQueue() {
    // queueItemCount == 1 (a single loaded item) must use the default branch —
    // the queue branch needs *more than one* item (v4 hasQueue() parity).
    val spec = CastOptionsDefaults.notificationActionsFor(1, MediaMetadata.MEDIA_TYPE_MOVIE)
    assertEquals(MediaIntentReceiver.ACTION_REWIND, spec.actions.first())
    assertArrayEquals(intArrayOf(1, 3), spec.compactViewIndices)
  }

  @Test
  fun nullMediaTypeUsesDefaultActions() {
    val spec = CastOptionsDefaults.notificationActionsFor(0, null)
    assertEquals(
      listOf(
        MediaIntentReceiver.ACTION_REWIND,
        MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
        MediaIntentReceiver.ACTION_FORWARD,
        MediaIntentReceiver.ACTION_STOP_CASTING,
      ),
      spec.actions
    )
    assertArrayEquals(intArrayOf(1, 3), spec.compactViewIndices)
  }

  @Test
  fun queueWinsOverPhoto() {
    // Queue takes precedence over the photo branch (v4 checked hasQueue() first)
    // — even with a null mediaType alongside a multi-item queue.
    val photoQueue = CastOptionsDefaults.notificationActionsFor(3, MediaMetadata.MEDIA_TYPE_PHOTO)
    assertEquals(MediaIntentReceiver.ACTION_SKIP_PREV, photoQueue.actions.first())
    assertArrayEquals(intArrayOf(1, 2), photoQueue.compactViewIndices)

    val nullTypeQueue = CastOptionsDefaults.notificationActionsFor(2, null)
    assertEquals(MediaIntentReceiver.ACTION_SKIP_PREV, nullTypeQueue.actions.first())
  }
}

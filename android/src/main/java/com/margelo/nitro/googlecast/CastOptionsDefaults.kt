package com.margelo.nitro.googlecast

import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.cast.framework.media.MediaIntentReceiver
import com.google.android.gms.common.images.WebImage

/**
 * The notification actions + compact-view indices for one media state
 * (Decision 4). `actions` are `MediaIntentReceiver.ACTION_*` values;
 * `compactViewIndices` index into `actions`.
 */
@Suppress("ArrayInDataClass")
internal data class NotificationActionsSpec(
  val actions: List<String>,
  val compactViewIndices: IntArray,
)

/**
 * Pure v4-parity defaults behind [NitroCastOptionsProvider] (design 4A) —
 * no `Context`, no Cast framework state, plain-JVM testable. Both branches
 * are pinned by the shared cross-platform vector corpus
 * `fixtures/cast-options/heuristics.json` (E3): the Swift `NitroImagePicker`
 * asserts the same `pickImage` vectors, so Kotlin/Swift drift is a red test.
 */
internal object CastOptionsDefaults {

  /** Queue (`queueItemCount > 1`): prev / toggle / next / stop, compact {1, 2}. */
  private val QUEUE_ACTIONS = listOf(
    MediaIntentReceiver.ACTION_SKIP_PREV,
    MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
    MediaIntentReceiver.ACTION_SKIP_NEXT,
    MediaIntentReceiver.ACTION_STOP_CASTING,
  )
  private val QUEUE_COMPACT = intArrayOf(1, 2)

  /** Photo (no seekable stream): toggle / stop, compact {0, 1}. */
  private val PHOTO_ACTIONS = listOf(
    MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
    MediaIntentReceiver.ACTION_STOP_CASTING,
  )
  private val PHOTO_COMPACT = intArrayOf(0, 1)

  /** Default: rewind / toggle / forward / stop, compact {1, 3}. */
  private val DEFAULT_ACTIONS = listOf(
    MediaIntentReceiver.ACTION_REWIND,
    MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK,
    MediaIntentReceiver.ACTION_FORWARD,
    MediaIntentReceiver.ACTION_STOP_CASTING,
  )
  private val DEFAULT_COMPACT = intArrayOf(1, 3)

  /**
   * The Decision-4 action set for the given media state. The queue branch
   * wins over the photo branch (v4 checked `hasQueue()` first), and a queue
   * needs *more than one* item — a single loaded item always reports
   * `queueItemCount == 1`. `mediaType == null` (no metadata) uses the default.
   */
  fun notificationActionsFor(queueItemCount: Int, mediaType: Int?): NotificationActionsSpec {
    return when {
      queueItemCount > 1 -> NotificationActionsSpec(QUEUE_ACTIONS, QUEUE_COMPACT)
      mediaType == MediaMetadata.MEDIA_TYPE_PHOTO ->
        NotificationActionsSpec(PHOTO_ACTIONS, PHOTO_COMPACT)
      else -> NotificationActionsSpec(DEFAULT_ACTIONS, DEFAULT_COMPACT)
    }
  }

  /**
   * v4-parity artwork selection (Decision 3): no images → `null` (plain
   * notification, never a throw); single image → first; the Cast-dialog
   * background surface → first; every other surface → second.
   */
  fun pickImage(images: List<WebImage>, hintType: Int): WebImage? {
    val index = pickImageIndex(images.size, hintType) ?: return null
    return images[index]
  }

  /**
   * The index [pickImage] selects, or `null` for an empty list — the pure
   * core the shared heuristic vectors drive directly (their shape is
   * `{surface, imageCount → expectedIndex|null}`).
   */
  fun pickImageIndex(imageCount: Int, hintType: Int): Int? {
    return when {
      imageCount == 0 -> null
      imageCount == 1 -> 0
      hintType == ImagePicker.IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND -> 0
      else -> 1
    }
  }
}

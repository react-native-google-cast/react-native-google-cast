package com.margelo.nitro.googlecast

import android.view.View
import androidx.mediarouter.app.MediaRouteButton
import java.lang.ref.WeakReference

/**
 * Attach-ordered registry of mounted Cast buttons (E10). It exists **only** so
 * `showIntroductoryOverlay` can anchor to "the" CastButton — v5 dialogs no
 * longer need a button. [current] is the most recently attached button that is
 * still attached to a window and `VISIBLE`, mirroring the iOS registry
 * (last-attached wins; attached + not hidden).
 *
 * Weak refs only (a dropped view must never be retained here); entries are
 * added/removed from the attach/detach window callbacks plus `onDropView`.
 * Main-thread only — attach callbacks and the transport's UI methods both run
 * on the main thread.
 */
internal object CastButtonRegistry {
  private val buttons = mutableListOf<WeakReference<MediaRouteButton>>()

  /** Called on attach-to-window. Re-registering moves [button] to the end (last-attached wins). */
  fun register(button: MediaRouteButton) {
    MainThread.assertMainThread("CastButtonRegistry.register")
    remove(button)
    buttons.add(WeakReference(button))
  }

  /** Called on detach-from-window and `onDropView`. Idempotent. */
  fun unregister(button: MediaRouteButton) {
    MainThread.assertMainThread("CastButtonRegistry.unregister")
    remove(button)
  }

  /** The overlay anchor: the last-attached button still attached and visible, else `null`. */
  val current: MediaRouteButton?
    get() {
      MainThread.assertMainThread("CastButtonRegistry.current")
      val anchor =
        buttons.lastOrNull { ref ->
          val button = ref.get()
          button != null && button.isAttachedToWindow && button.visibility == View.VISIBLE
        }
      return anchor?.get()
    }

  /** Drops [button] and any garbage-collected entries. */
  private fun remove(button: MediaRouteButton) {
    buttons.removeAll { it.get() == null || it.get() === button }
  }
}

package com.margelo.nitro.googlecast

import android.app.Activity
import android.content.Context
import android.os.SystemClock
import android.view.ContextThemeWrapper
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.RootView
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * JS-responder interception fix (#616, port of v4 PR #582): ACTION_DOWN on the
 * button must notify the React [RootView] via `NativeGestureUtil` so Fabric
 * cancels the JS responder instead of stealing the touch stream, and the
 * notification must be safe outside a React view hierarchy.
 *
 * Runs on the JVM with a fake [RootView] parent — no Fabric runtime needed:
 * `NativeGestureUtil.notifyNativeGestureStarted` only walks up the view tree
 * to the first [RootView] and calls `onChildStartedNativeGesture` on it.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class TintableMediaRouteButtonTouchTest {

  /** Fake React root that records native-gesture notifications. */
  private class RecordingRootView(context: Context) : FrameLayout(context), RootView {
    var startedCount = 0
    var lastChild: View? = null

    override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
      startedCount++
      lastChild = childView
    }

    override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) = Unit

    override fun handleException(t: Throwable) = throw t
  }

  /**
   * `MediaRouteButton`'s constructor runs `MediaRouterThemeHelper` contrast
   * math against the theme's `colorPrimary`; Robolectric's default theme
   * resolves it to transparent, so wrap in a theme with a solid one.
   */
  private fun themed(base: Context): Context =
    ContextThemeWrapper(base, androidx.appcompat.R.style.Theme_AppCompat)

  private val context: Context get() = themed(RuntimeEnvironment.getApplication())

  private fun motionEvent(action: Int): MotionEvent {
    val now = SystemClock.uptimeMillis()
    return MotionEvent.obtain(now, now, action, 10f, 10f, 0)
  }

  @Test
  fun actionDownNotifiesReactRootOfNativeGesture() {
    val root = RecordingRootView(context)
    val button = TintableMediaRouteButton(context)
    root.addView(button)

    button.onTouchEvent(motionEvent(MotionEvent.ACTION_DOWN))

    assertEquals(1, root.startedCount)
    assertSame(button, root.lastChild)
  }

  @Test
  fun onlyActionDownNotifies() {
    val root = RecordingRootView(context)
    val button = TintableMediaRouteButton(context)
    root.addView(button)

    button.onTouchEvent(motionEvent(MotionEvent.ACTION_MOVE))
    button.onTouchEvent(motionEvent(MotionEvent.ACTION_UP))

    assertEquals(0, root.startedCount)
  }

  @Test
  fun touchWithoutAnyReactRootDoesNotCrash() {
    // Detached plain hierarchy: the RootView walk ends at a null parent.
    val plainParent = FrameLayout(context)
    val button = TintableMediaRouteButton(context)
    plainParent.addView(button)

    button.onTouchEvent(motionEvent(MotionEvent.ACTION_DOWN))
  }

  @Test
  fun touchInNonReactWindowDoesNotCrash() {
    // Attached to a real (non-React) window: the RootView walk reaches the
    // ViewRootImpl — a non-View parent — which trips RN's internal assertion;
    // the button must swallow it (guard in TintableMediaRouteButton).
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val button = TintableMediaRouteButton(themed(activity))
    activity.setContentView(button)

    button.onTouchEvent(motionEvent(MotionEvent.ACTION_DOWN))
  }
}

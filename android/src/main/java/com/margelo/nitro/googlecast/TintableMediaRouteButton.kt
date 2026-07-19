package com.margelo.nitro.googlecast

import android.content.Context
import android.graphics.drawable.Drawable
import android.view.MotionEvent
import androidx.core.graphics.drawable.DrawableCompat
import androidx.mediarouter.app.MediaRouteButton
import com.facebook.react.uimanager.events.NativeGestureUtil

/**
 * [MediaRouteButton] whose remote-indicator drawable can be tinted (the v4
 * `ColorableMediaRouteButton`, https://stackoverflow.com/a/41496796).
 *
 * MediaRouteButton swaps its indicator drawable as the route state changes, so
 * the tint is stored and re-applied from [setRemoteIndicatorDrawable] whenever
 * a new drawable lands. A `null` tint clears back to the default color (E11) —
 * v4 could only ever set a tint, never remove one.
 */
internal class TintableMediaRouteButton(context: Context) : MediaRouteButton(context) {
  private var indicatorDrawable: Drawable? = null
  private var tintColor: Int? = null

  /**
   * Claim the gesture for this native button before the JS responder can steal
   * it (#616, port of v4 PR #582). When an ancestor claims the JS responder
   * (`onStartShouldSetResponder`), Fabric's `ReactViewGroup` intercepts the
   * rest of the touch stream, so the button receives ACTION_DOWN but never the
   * ACTION_UP that completes the click. `NativeGestureUtil` (also used by RN's
   * own ScrollView/DrawerLayout under Fabric) notifies the React root view,
   * which cancels the JS responder for this gesture and leaves the stream with
   * the button.
   */
  override fun onTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN) {
      try {
        NativeGestureUtil.notifyNativeGestureStarted(this, event)
      } catch (_: AssertionError) {
        // Outside a React hierarchy (plain Android window, Robolectric host
        // activity) RootViewUtil's parent walk can reach a non-View parent
        // (ViewRootImpl) before any RootView and trip RN's assertion. There is
        // no JS responder to cancel there — swallow and let the button work.
      }
    }
    return super.onTouchEvent(event)
  }

  override fun setRemoteIndicatorDrawable(d: Drawable?) {
    indicatorDrawable = d
    super.setRemoteIndicatorDrawable(d)
    if (tintColor != null) applyTint(tintColor)
  }

  /** Tint the current indicator drawable; `null` clears to the default (E11). */
  fun applyTint(color: Int?) {
    tintColor = color
    val drawable = indicatorDrawable ?: return
    // mutate() un-shares the ConstantState: without it, tinting one mounted
    // CastButton bleeds onto every other one using the same theme drawable.
    val wrapped = DrawableCompat.wrap(drawable).mutate()
    if (color != null) {
      DrawableCompat.setTint(wrapped, color)
    } else {
      DrawableCompat.setTintList(wrapped, null)
    }
  }
}

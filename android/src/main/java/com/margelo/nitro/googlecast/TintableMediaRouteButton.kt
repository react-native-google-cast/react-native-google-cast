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
   *
   * The started call MUST be paired with `notifyNativeGestureEnded` on the
   * terminal event (UP/CANCEL — the ScrollView pattern): `JSPointerDispatcher`
   * drops every pointer event while a child holds the native gesture and only
   * `onChildEndedNativeGesture` releases it, so without the ended call one tap
   * would silence `onPointer*` for the whole surface.
   */
  override fun onTouchEvent(event: MotionEvent): Boolean {
    when (event.actionMasked) {
      MotionEvent.ACTION_DOWN ->
        notifyReactRoot { NativeGestureUtil.notifyNativeGestureStarted(this, event) }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL ->
        notifyReactRoot { NativeGestureUtil.notifyNativeGestureEnded(this, event) }
    }
    return super.onTouchEvent(event)
  }

  private inline fun notifyReactRoot(notify: () -> Unit) {
    try {
      notify()
    } catch (_: AssertionError) {
      // Outside a React hierarchy (plain Android window, Robolectric host
      // activity) RootViewUtil's parent walk can reach a non-View parent
      // (ViewRootImpl) before any RootView and trip RN's assertion. There is
      // no JS responder to cancel there — swallow and let the button work.
    }
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

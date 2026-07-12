package com.margelo.nitro.googlecast

import android.content.Context
import android.graphics.drawable.Drawable
import androidx.core.graphics.drawable.DrawableCompat
import androidx.mediarouter.app.MediaRouteButton

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

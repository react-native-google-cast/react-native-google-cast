package com.margelo.nitro.googlecast

import android.view.ContextThemeWrapper
import android.view.View
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.CastContext
import com.margelo.nitro.views.RecyclableView

/**
 * Nitro HybridView backing `<CastButton />` on Android: a single
 * [TintableMediaRouteButton] wired to the Cast framework. Constructed by the
 * generated `HybridCastButtonManager` with the `ThemedReactContext` of the
 * surface it mounts on.
 *
 * v4-faithful construction order: the `Theme_MediaRouter` remote-indicator
 * drawable is set **before** `CastButtonFactory.setUpMediaRouteButton`
 * (otherwise the button does not initiate with the correct visual state), and
 * a missing/broken Cast framework degrades to an inert default button
 * (try/catch like v4) — the view never throws across the bridge.
 *
 * Registers in [CastButtonRegistry] while attached to a window (E10) so
 * `showIntroductoryOverlay` can anchor to the most recently attached visible
 * button; unregisters on detach, [onDropView], and [prepareForRecycle].
 */
@Keep
@DoNotStrip
class HybridCastButton(reactContext: ThemedReactContext) :
  HybridCastButtonSpec(), RecyclableView {

  private val button = TintableMediaRouteButton(reactContext)

  init {
    // Resolve the enabled-state indicator drawable from the MediaRouter theme…
    val themedContext =
      ContextThemeWrapper(reactContext, androidx.mediarouter.R.style.Theme_MediaRouter)
    val styleAttrs =
      themedContext.obtainStyledAttributes(
        null,
        androidx.mediarouter.R.styleable.MediaRouteButton,
        androidx.mediarouter.R.attr.mediaRouteButtonStyle,
        0
      )
    val drawable =
      styleAttrs.getDrawable(
        androidx.mediarouter.R.styleable.MediaRouteButton_externalRouteEnabledDrawable
      )
    styleAttrs.recycle()

    // …and set it BEFORE CastButtonFactory.setUpMediaRouteButton, else the
    // button won't initiate with the correct visual state (v4 dance).
    button.setRemoteIndicatorDrawable(drawable)

    try {
      CastContext.getSharedInstance(reactContext)
      CastButtonFactory.setUpMediaRouteButton(reactContext, button)
    } catch (_: Exception) {
      // Cast framework unavailable (e.g. missing/outdated Play Services) —
      // leave the default, inert button rather than crash (v4 behavior).
    }

    button.addOnAttachStateChangeListener(
      object : View.OnAttachStateChangeListener {
        override fun onViewAttachedToWindow(v: View) = CastButtonRegistry.register(button)
        override fun onViewDetachedFromWindow(v: View) = CastButtonRegistry.unregister(button)
      }
    )
  }

  override val view: View
    get() = button

  override var tintColor: Double? = null
    set(value) {
      field = value
      // Processed AARRGGBB color from RN's `processColor`. It may arrive as a
      // signed or an unsigned 32-bit value; `toLong().toInt()` maps both onto
      // the same Android color int (a plain `toInt()` would clamp unsigned
      // values above Int.MAX_VALUE). Null clears back to the default (E11).
      button.applyTint(value?.toLong()?.toInt())
    }

  override fun onDropView() {
    CastButtonRegistry.unregister(button)
    super.onDropView()
  }

  override fun prepareForRecycle() {
    // Reset to default props for the next mount (the setter clears the tint).
    tintColor = null
    CastButtonRegistry.unregister(button)
  }
}

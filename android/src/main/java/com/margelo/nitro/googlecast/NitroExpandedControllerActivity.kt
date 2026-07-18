package com.margelo.nitro.googlecast

import android.view.Menu
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.media.widget.ExpandedControllerActivity

/**
 * GCK's default expanded controller with a Cast button in the toolbar (the v4
 * `RNGCExpandedControllerActivity`, ported). Launched by
 * `CastContext.showExpandedControls()` and by Cast-notification taps (wired by
 * `NitroCastOptionsProvider`).
 *
 * Registration is automatic (Decision 1): this library's manifest declares
 * the activity (`android:exported="false"`), so consuming apps must NOT add
 * their own `<activity>` — a stale manual declaration from 6.1 causes an
 * `android:theme` manifest-merger conflict. The theme is the library-defined
 * `@style/NitroCastExpandedController`; consumers restyle the controller by
 * redefining that style in their app resources.
 */
class NitroExpandedControllerActivity : ExpandedControllerActivity() {
  override fun onCreateOptionsMenu(menu: Menu): Boolean {
    super.onCreateOptionsMenu(menu)
    menuInflater.inflate(R.menu.cast_expanded_controller_menu, menu)
    try {
      CastButtonFactory.setUpMediaRouteButton(this, menu, R.id.media_route_menu_item)
    } catch (e: Exception) {
      // Cast framework unavailable: degrade to a button-less toolbar instead
      // of crashing the launched activity (same posture as HybridCastButton).
    }
    return true
  }
}

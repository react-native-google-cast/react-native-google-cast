package com.margelo.nitro.googlecast

import android.view.Menu
import com.google.android.gms.cast.framework.CastButtonFactory
import com.google.android.gms.cast.framework.media.widget.ExpandedControllerActivity

/**
 * GCK's default expanded controller with a Cast button in the toolbar (the v4
 * `RNGCExpandedControllerActivity`, ported). Launched by
 * `CastContext.showExpandedControls()`.
 *
 * Android only launches activities declared in the *app* manifest, so the
 * consuming app must register it (automatic wiring lands in slice 6.2):
 *
 * ```xml
 * <activity
 *   android:name="com.margelo.nitro.googlecast.NitroExpandedControllerActivity"
 *   android:exported="false"
 *   android:theme="@style/Theme.AppCompat.NoActionBar" />
 * ```
 */
class NitroExpandedControllerActivity : ExpandedControllerActivity() {
  override fun onCreateOptionsMenu(menu: Menu): Boolean {
    super.onCreateOptionsMenu(menu)
    menuInflater.inflate(R.menu.cast_expanded_controller_menu, menu)
    CastButtonFactory.setUpMediaRouteButton(this, menu, R.id.media_route_menu_item)
    return true
  }
}

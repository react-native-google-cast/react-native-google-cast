package com.reactnative.googlecast;

import android.view.Menu;
import android.view.MenuItem;

import androidx.core.view.MenuItemCompat;
import androidx.mediarouter.app.MediaRouteActionProvider;

import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.media.widget.ExpandedControllerActivity;

public class RNGCExpandedControllerActivity
  extends ExpandedControllerActivity {

  private static final int MENU_CAST = Menu.FIRST;

  @Override
  public boolean onCreateOptionsMenu(Menu menu) {
    super.onCreateOptionsMenu(menu);
    menu.add(0, MENU_CAST, Menu.NONE, "Cast");
    MenuItem item = menu.findItem(MENU_CAST);
    MenuItemCompat.setActionProvider(
      item, new MediaRouteActionProvider(getApplicationContext()));
    CastButtonFactory.setUpMediaRouteButton(this, menu, MENU_CAST);
    return true;
  }
}

package com.reactnative.googlecast;

import androidx.mediarouter.app.MediaRouteButton;
import android.view.View;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.cast.framework.CastStateListener;

public class GoogleCastButtonManager
    extends SimpleViewManager<MediaRouteButton> {

  public static final String REACT_CLASS = "RNGoogleCastButton";
  private Integer mColor = -1;
  private static MediaRouteButton googleCastButtonManagerInstance;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public MediaRouteButton createViewInstance(ThemedReactContext context) {
    CastContext castContext = CastContext.getSharedInstance(context);

    final MediaRouteButton button = new MediaRouteButton(context);
    googleCastButtonManagerInstance = button;

    CastButtonFactory.setUpMediaRouteButton(context, button);

    updateButtonState(button, castContext.getCastState());

    if (mColor != null) {
      TintableMediaRouteActionProvider.colorWorkaroundForCastIcon(button, mColor);
    }


    castContext.addCastStateListener(new CastStateListener() {
      @Override
      public void onCastStateChanged(int newState) {
        GoogleCastButtonManager.this.updateButtonState(button, newState);
      }
    });

    return button;
  }

  public static MediaRouteButton getGoogleCastButtonManagerInstance() {
    return googleCastButtonManagerInstance;
  }

  @ReactProp(name = "tintColor", defaultInt = -1)
  public void setTintColor(MediaRouteButton button, Integer color) {
    if (color == null)
      return;
    TintableMediaRouteActionProvider.colorWorkaroundForCastIcon(button, color);
    mColor = color;
  }

  private void updateButtonState(MediaRouteButton button, int state) {
    // hide the button when no device available (default behavior is show it
    // disabled)
    if (CastState.NO_DEVICES_AVAILABLE == state) {
      button.setVisibility(View.GONE);
    } else {
      button.setVisibility(View.VISIBLE);
    }
  }
}

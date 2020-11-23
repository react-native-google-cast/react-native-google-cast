package com.reactnative.googlecast;

import android.content.Context;
import android.graphics.drawable.Drawable;
import androidx.core.graphics.drawable.DrawableCompat;
import androidx.mediarouter.app.MediaRouteButton;
import android.util.AttributeSet;
import android.view.View;
import android.os.Build;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.cast.framework.CastStateListener;

import com.reactnative.googlecast.TintableMediaRouteActionProvider;

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


  // https://stackoverflow.com/a/41496796/384349
  /*private class ColorableMediaRouteButton extends MediaRouteButton {
    protected Drawable mRemoteIndicatorDrawable;

    public ColorableMediaRouteButton(Context context) { super(context); }

    public ColorableMediaRouteButton(Context context, AttributeSet attrs) {
      super(context, attrs);
    }

    public ColorableMediaRouteButton(Context context, AttributeSet attrs,
                                     int defStyleAttr) {
      super(context, attrs, defStyleAttr);
    }

    public static Drawable getTintedDrawable(@NonNull final Context context,
                                             @DrawableRes int drawableRes, @ColorRes int colorRes) {
      Drawable d = ContextCompat.getDrawable(context, drawableRes);
      d = DrawableCompat.wrap(d);
      DrawableCompat.setTint(d.mutate(), ContextCompat.getColor(context, colorRes));
      return d;
    }

    @Override
    public void setRemoteIndicatorDrawable(Drawable d) {
      mRemoteIndicatorDrawable = d;
      super.setRemoteIndicatorDrawable(d);
      if (mColor != null)
        applyTint(mColor);
    }

    public void applyTint(Integer color) {
      if (mRemoteIndicatorDrawable == null)
        return;

      //Drawable wrapDrawable = DrawableCompat.wrap(mRemoteIndicatorDrawable);
      //DrawableCompat.setTint(wrapDrawable, color);



    }
  }*/
}

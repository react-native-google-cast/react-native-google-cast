package com.reactnative.googlecast.components;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.ContextThemeWrapper;
import android.view.View;

import androidx.core.graphics.drawable.DrawableCompat;
import androidx.mediarouter.app.MediaRouteButton;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.cast.framework.CastStateListener;


import java.util.ArrayList;
import java.util.List;

public class RNGoogleCastButtonManager
    extends SimpleViewManager<MediaRouteButton> {

  public static final String REACT_CLASS = "RNGoogleCastButton";
  private Integer mColor = null;

  protected static List<MediaRouteButton> currentInstances = new ArrayList<>();

  // there can be multiple screens that have a cast button, we use the latest one
  public static MediaRouteButton getCurrent() {
    return currentInstances.get(currentInstances.size() - 1);
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public MediaRouteButton createViewInstance(ThemedReactContext context) {
    CastContext castContext = CastContext.getSharedInstance(context);

    final MediaRouteButton button = new ColorableMediaRouteButton(context);
    Context otherContext = new ContextThemeWrapper(context, androidx.mediarouter.R.style.Theme_MediaRouter);

    TypedArray styleAttrs = otherContext.obtainStyledAttributes(null, androidx.mediarouter.R.styleable.MediaRouteButton, androidx.mediarouter.R.attr.mediaRouteButtonStyle, 0);
    Drawable drawable = styleAttrs.getDrawable(androidx.mediarouter.R.styleable.MediaRouteButton_externalRouteEnabledDrawable);
    styleAttrs.recycle();

    CastButtonFactory.setUpMediaRouteButton(context, button);

    updateButtonState(button, castContext.getCastState());
    button.setRemoteIndicatorDrawable(drawable);

    castContext.addCastStateListener(new CastStateListener() {
      @Override
      public void onCastStateChanged(int newState) {
        RNGoogleCastButtonManager.this.updateButtonState(button, newState);
      }
    });

    return button;
  }

  @ReactProp(name = "tintColor", customType = "Color")
  public void setTintColor(ColorableMediaRouteButton button, Integer color) {
    if (color == null)
      return;
    button.applyTint(color);
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
  private class ColorableMediaRouteButton extends MediaRouteButton {
    protected Drawable mRemoteIndicatorDrawable;

    public ColorableMediaRouteButton(Context context) { super(context); }

    public ColorableMediaRouteButton(Context context, AttributeSet attrs) {
      super(context, attrs);
    }

    public ColorableMediaRouteButton(Context context, AttributeSet attrs,
                                     int defStyleAttr) {
      super(context, attrs, defStyleAttr);
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

      Drawable wrapDrawable = DrawableCompat.wrap(mRemoteIndicatorDrawable);
      DrawableCompat.setTint(wrapDrawable, color);
    }

    @Override
    public void onDetachedFromWindow() {
      super.onDetachedFromWindow();
      RNGoogleCastButtonManager.currentInstances.remove(this);
    }

    @Override
    public void onAttachedToWindow() {
      super.onAttachedToWindow();
      RNGoogleCastButtonManager.currentInstances.add(this);
    }
  }
}
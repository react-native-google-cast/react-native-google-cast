package com.reactnative.googlecast.components;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.ContextThemeWrapper;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
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
  public static @Nullable MediaRouteButton getCurrent() {
    if (currentInstances.size() == 0) return null;
    return currentInstances.get(currentInstances.size() - 1);
  }

  @Override
  public @NonNull String getName() {
    return REACT_CLASS;
  }

  @Override
  public @NonNull MediaRouteButton createViewInstance(@NonNull ThemedReactContext context) {
    final MediaRouteButton button = new ColorableMediaRouteButton(context);

    Context contextThemeWrapper = new ContextThemeWrapper(context, androidx.mediarouter.R.style.Theme_MediaRouter);
    TypedArray styleAttrs = contextThemeWrapper.obtainStyledAttributes(null, androidx.mediarouter.R.styleable.MediaRouteButton, androidx.mediarouter.R.attr.mediaRouteButtonStyle, 0);
    Drawable drawable = styleAttrs.getDrawable(androidx.mediarouter.R.styleable.MediaRouteButton_externalRouteEnabledDrawable);
    styleAttrs.recycle();

    // the drawable needs to be set before calling CastButtonFactory.setupMediaRouteButton()
    // otherwise it won't initiate with the correct visual state
    button.setRemoteIndicatorDrawable(drawable);

    try {
      CastContext.getSharedInstance(context);
      CastButtonFactory.setUpMediaRouteButton(context, button);
    } catch (Exception e) {
    }

    return button;
  }

  @ReactProp(name = "tintColor", customType = "Color")
  public void setTintColor(ColorableMediaRouteButton button, Integer color) {
    if (color == null)
      return;
    button.applyTint(color);
    mColor = color;
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

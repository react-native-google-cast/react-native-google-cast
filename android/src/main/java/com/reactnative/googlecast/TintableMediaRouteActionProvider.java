package com.reactnative.googlecast;
import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.drawable.Drawable;
import androidx.annotation.ColorInt;
import androidx.core.graphics.drawable.DrawableCompat;
import androidx.mediarouter.app.MediaRouteButton;
import androidx.appcompat.view.ContextThemeWrapper;

public class TintableMediaRouteActionProvider {
    private TintableMediaRouteActionProvider() {
    }
    public static void colorWorkaroundForCastIcon(MediaRouteButton button, @ColorInt int tintColor) {
        if (button == null) return;
        Context castContext = new ContextThemeWrapper(button.getContext(),  androidx.mediarouter.R.style.Theme_MediaRouter);
        TypedArray a = castContext.obtainStyledAttributes(null,
                androidx.mediarouter.R.styleable.MediaRouteButton,  androidx.mediarouter.R.attr.mediaRouteButtonStyle, 0);
        Drawable drawable = a.getDrawable(
                androidx.mediarouter.R.styleable.MediaRouteButton_externalRouteEnabledDrawable);
        a.recycle();
        if (drawable != null) {
            DrawableCompat.setTint(drawable, tintColor);
            drawable.setState(button.getDrawableState());
            button.setRemoteIndicatorDrawable(drawable);
        }
    }
}
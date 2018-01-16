package com.googlecast;

import android.support.v7.app.MediaRouteButton;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.gms.cast.framework.CastButtonFactory;

public class GoogleCastButtonManager extends SimpleViewManager<MediaRouteButton> {

    public static final String REACT_CLASS = "GoogleCastButton";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public MediaRouteButton createViewInstance(ThemedReactContext context) {
        MediaRouteButton button = new MediaRouteButton(context);
        CastButtonFactory.setUpMediaRouteButton(context, button);
        return button;
    }
}

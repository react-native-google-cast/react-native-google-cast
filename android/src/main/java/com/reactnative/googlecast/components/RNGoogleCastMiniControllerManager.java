package com.reactnative.googlecast.components;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class RNGoogleCastMiniControllerManager extends SimpleViewManager<RNGoogleCastMiniControllerView> {
    public static final String REACT_CLASS = "RNGoogleCastMiniController";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected RNGoogleCastMiniControllerView createViewInstance(ThemedReactContext reactContext) {
        return new RNGoogleCastMiniControllerView(reactContext.getCurrentActivity());
    }
}

package com.reactnative.googlecast.components;

import android.content.Context;
import android.view.LayoutInflater;
import android.widget.FrameLayout;

import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;

import com.google.android.gms.cast.framework.media.widget.MiniControllerFragment;

public class RNGoogleCastMiniControllerView extends FrameLayout {
    private final FragmentActivity activity;
    private MiniControllerFragment miniControllerFragment;

    public RNGoogleCastMiniControllerView(Context context) {
        super(context);
        this.activity = (FragmentActivity) context;

        int containerId = generateViewId();
        setId(containerId);

        miniControllerFragment = new MiniControllerFragment();
        FragmentManager fragmentManager = activity.getSupportFragmentManager();
        fragmentManager.beginTransaction()
                .replace(containerId, miniControllerFragment)
                .commit();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        // Remove the fragment when the view is detached
        if (miniControllerFragment != null && activity != null) {
            activity.getSupportFragmentManager()
                    .beginTransaction()
                    .remove(miniControllerFragment)
                    .commitAllowingStateLoss();
        }
    }
}

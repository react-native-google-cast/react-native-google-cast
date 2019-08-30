package com.reactnative.googlecast.castvideos;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.reactnativenavigation.NavigationActivity;
import com.google.android.gms.cast.framework.CastContext;

public class MainActivity extends NavigationActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // lazy load Google Cast context
    CastContext.getSharedInstance(this);
  }
}

package com.reactnative.googlecast.castvideos;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.reactnative.googlecast.api.RNGCCastContext;
import com.reactnativenavigation.NavigationActivity;

public class MainActivity extends NavigationActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // lazy load Google Cast context
    RNGCCastContext.getSharedInstance(this);
  }
}

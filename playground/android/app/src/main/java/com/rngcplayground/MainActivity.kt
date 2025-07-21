package com.rngcplayground

import android.os.Bundle
import androidx.annotation.Nullable
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.gms.cast.framework.CastContext

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "RNGCPlayground"

  override fun onCreate(@Nullable savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    try {
      // lazy load Google Cast context
      CastContext.getSharedInstance(this)
    } catch (e: Exception) {
      // cast framework not supported
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}

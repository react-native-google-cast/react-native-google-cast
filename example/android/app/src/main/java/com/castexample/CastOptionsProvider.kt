package com.castexample

import android.content.Context
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider

/**
 * Google Cast OptionsProvider for the example app.
 *
 * Android requires this (registered via AndroidManifest meta-data
 * OPTIONS_PROVIDER_CLASS_NAME) before CastContext.getSharedInstance() works.
 * It's the Android counterpart to the iOS AppDelegate GCKCastContext setup.
 * v5 will generate this for consumers via the Expo config plugin.
 */
class CastOptionsProvider : OptionsProvider {
  override fun getCastOptions(context: Context): CastOptions {
    return CastOptions.Builder()
      // Default Media Receiver (matches iOS kGCKDefaultMediaReceiverApplicationID).
      .setReceiverApplicationId("CC1AD845")
      .build()
  }

  override fun getAdditionalSessionProviders(
    context: Context
  ): List<SessionProvider>? = null
}

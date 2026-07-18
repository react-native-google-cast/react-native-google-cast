package com.margelo.nitro.googlecast

import android.content.Context
import com.google.android.gms.cast.CastMediaControlIntent
import com.google.android.gms.cast.framework.CastOptions
import com.google.android.gms.cast.framework.OptionsProvider
import com.google.android.gms.cast.framework.SessionProvider
import com.google.android.gms.cast.framework.media.CastMediaOptions
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.cast.framework.media.NotificationOptions

/**
 * The library `OptionsProvider` (Decision 2), activated by the app manifest:
 *
 * ```xml
 * <meta-data
 *   android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
 *   android:value="com.margelo.nitro.googlecast.NitroCastOptionsProvider" />
 * ```
 *
 * Configuration is read from `<meta-data>` in the v5 namespace (contract iv):
 * `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` (absent/blank →
 * default media receiver) and `com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED`
 * (absent → `true`).
 *
 * **Reentrancy (contract iii):** [getCastOptions] runs *inside*
 * `CastContext.getSharedInstance(context)` initialization, so nothing on this
 * path may call back into `CastContext` — it reads only
 * `Context`/`PackageManager` meta-data. Session-dependent state is resolved
 * lazily at notification-build time by [NitroNotificationActionsProvider].
 *
 * **Subclassing (E7):** `open`, with one protected seam per concern —
 * [getReceiverApplicationId], [getNotificationOptions], [getImagePicker] —
 * so a subclass overrides exactly one without rebuilding the rest. The
 * manifest meta-data keys above are honored by this class (and subclasses
 * that call `super`); a from-scratch `OptionsProvider` ignores them.
 * Subclasses are instantiated reflectively by the Cast SDK, so release
 * builds need the consumer's own R8/ProGuard keep rule (this library ships
 * one only for this class — see `android/proguard-rules.pro`, E5).
 */
open class NitroCastOptionsProvider : OptionsProvider {

  override fun getCastOptions(context: Context): CastOptions {
    return CastOptions.Builder()
      .setReceiverApplicationId(getReceiverApplicationId(context))
      .setCastMediaOptions(getCastMediaOptions(context))
      .build()
  }

  override fun getAdditionalSessionProviders(context: Context): List<SessionProvider>? = null

  /**
   * The receiver application id (E7 seam): the
   * `RECEIVER_APPLICATION_ID` meta-data, falling back to the Default Media
   * Receiver (`CC1AD845`) when absent or blank (contract iv).
   */
  protected open fun getReceiverApplicationId(context: Context): String {
    return NitroCastMetaData.receiverApplicationId(context)
      ?: CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID
  }

  /**
   * The media notification configuration (E7 seam), or `null` to disable the
   * notification entirely — the documented `setNotificationOptions(null)`
   * mechanism, driven by the `NOTIFICATIONS_ENABLED` meta-data (default
   * `true`). Actions come from [NitroNotificationActionsProvider]
   * (Decision 4); tapping the notification opens
   * [NitroExpandedControllerActivity] (v4 parity).
   */
  protected open fun getNotificationOptions(context: Context): NotificationOptions? {
    if (!NitroCastMetaData.notificationsEnabled(context)) return null
    return NotificationOptions.Builder()
      .setNotificationActionsProvider(NitroNotificationActionsProvider(context))
      .setTargetActivityClassName(NitroExpandedControllerActivity::class.java.name)
      .build()
  }

  /**
   * The artwork picker (E7 seam), or `null` for the SDK's built-in default
   * (always-first-image). Defaults to the v4-parity [NitroImagePicker].
   */
  protected open fun getImagePicker(): ImagePicker? = NitroImagePicker()

  private fun getCastMediaOptions(context: Context): CastMediaOptions {
    return CastMediaOptions.Builder()
      .setImagePicker(getImagePicker())
      .setExpandedControllerActivityClassName(NitroExpandedControllerActivity::class.java.name)
      .setNotificationOptions(getNotificationOptions(context))
      .build()
  }
}

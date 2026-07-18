package com.margelo.nitro.googlecast

import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle

/**
 * Reads the library's `<meta-data>` configuration from the *app* manifest
 * (contract iv). Touches only `Context`/`PackageManager` — never the Cast
 * framework — so it is safe to call from inside
 * [NitroCastOptionsProvider.getCastOptions] (reentrancy contract iii).
 */
internal object NitroCastMetaData {
  const val RECEIVER_APPLICATION_ID = "com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID"
  const val NOTIFICATIONS_ENABLED = "com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED"

  /**
   * The configured receiver application id, or `null` when the meta-data is
   * absent or blank (both fall back to the default media receiver — iv).
   */
  fun receiverApplicationId(context: Context): String? {
    val value = metaData(context)?.getString(RECEIVER_APPLICATION_ID) ?: return null
    if (value.isBlank()) return null
    return value
  }

  /**
   * Whether the Cast media notification is enabled. Absent meta-data defaults
   * to `true`; the manifest parser stores `android:value="false"` as a
   * `Boolean`, so [Bundle.getBoolean] reads it directly.
   */
  fun notificationsEnabled(context: Context): Boolean {
    val metaData = metaData(context) ?: return true
    return metaData.getBoolean(NOTIFICATIONS_ENABLED, true)
  }

  private fun metaData(context: Context): Bundle? {
    return try {
      context.packageManager
        .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        .metaData
    } catch (e: PackageManager.NameNotFoundException) {
      null // own package missing = degenerate environment; use defaults
    }
  }
}

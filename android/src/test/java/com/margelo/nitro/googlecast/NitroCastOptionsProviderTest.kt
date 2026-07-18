package com.margelo.nitro.googlecast

import android.content.Context
import android.net.Uri
import android.os.Bundle
import com.google.android.gms.cast.CastMediaControlIntent
import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.media.ImageHints
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.cast.framework.media.NotificationOptions
import com.google.android.gms.common.images.WebImage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows
import org.robolectric.annotation.Config

/**
 * Robolectric suite for [NitroCastOptionsProvider] (plan Task 7 Step 5):
 * the meta-data matrix via the shadow package manager, `getCastOptions()`
 * wiring, and the E7 subclass seams. Everything on the `getCastOptions` path
 * is AnyMap-free, so the whole provider runs on the JVM — and every test
 * doubles as a reentrancy proof (contract iii): no `CastContext` is ever
 * initialized here, so any `getSharedInstance(context)` call would throw.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class NitroCastOptionsProviderTest {

  private val context: Context
    get() = RuntimeEnvironment.getApplication()

  private val provider = NitroCastOptionsProvider()

  /** Install [bundle] as the app's manifest meta-data (null = no meta-data). */
  private fun setMetaData(bundle: Bundle?) {
    val packageInfo = Shadows.shadowOf(context.packageManager)
      .getInternalMutablePackageInfo(context.packageName)
    checkNotNull(packageInfo.applicationInfo).metaData = bundle
  }

  // MARK: - receiver application id (meta-data matrix, contract iv)

  @Test
  fun receiverIdDefaultsWhenMetaDataAbsent() {
    setMetaData(null)
    assertEquals(
      CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID,
      provider.getCastOptions(context).receiverApplicationId
    )
  }

  @Test
  fun receiverIdDefaultsWhenKeyMissing() {
    setMetaData(Bundle())
    assertEquals(
      CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID,
      provider.getCastOptions(context).receiverApplicationId
    )
  }

  @Test
  fun receiverIdDefaultsWhenBlank() {
    setMetaData(Bundle().apply { putString(NitroCastMetaData.RECEIVER_APPLICATION_ID, "   ") })
    assertEquals(
      CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID,
      provider.getCastOptions(context).receiverApplicationId
    )
  }

  @Test
  fun explicitReceiverIdPassesThrough() {
    setMetaData(Bundle().apply { putString(NitroCastMetaData.RECEIVER_APPLICATION_ID, "ABCD1234") })
    assertEquals("ABCD1234", provider.getCastOptions(context).receiverApplicationId)
  }

  // MARK: - notifications toggle (meta-data matrix)

  @Test
  fun notificationsEnabledByDefault() {
    setMetaData(null)
    val mediaOptions = checkNotNull(provider.getCastOptions(context).castMediaOptions)
    assertNotNull("notification options expected by default", mediaOptions.notificationOptions)
  }

  @Test
  fun notificationsEnabledWhenMetaDataTrue() {
    setMetaData(Bundle().apply { putBoolean(NitroCastMetaData.NOTIFICATIONS_ENABLED, true) })
    val mediaOptions = checkNotNull(provider.getCastOptions(context).castMediaOptions)
    assertNotNull(mediaOptions.notificationOptions)
  }

  @Test
  fun notificationsDisabledWhenMetaDataFalse() {
    setMetaData(Bundle().apply { putBoolean(NitroCastMetaData.NOTIFICATIONS_ENABLED, false) })
    val mediaOptions = checkNotNull(provider.getCastOptions(context).castMediaOptions)
    assertNull("setNotificationOptions(null) disables the notification", mediaOptions.notificationOptions)
    // Disabling notifications keeps the rest of the media wiring intact.
    assertNotNull("image picker survives disabled notifications", mediaOptions.imagePicker)
    assertEquals(
      NitroExpandedControllerActivity::class.java.name,
      mediaOptions.expandedControllerActivityClassName
    )
  }

  // MARK: - getCastOptions wiring

  @Test
  fun castOptionsWiresExpandedControllerPickerAndNotificationTarget() {
    setMetaData(null)
    val mediaOptions = checkNotNull(provider.getCastOptions(context).castMediaOptions)
    assertEquals(
      NitroExpandedControllerActivity::class.java.name,
      mediaOptions.expandedControllerActivityClassName
    )
    assertTrue(
      "default image picker is NitroImagePicker",
      mediaOptions.imagePicker is NitroImagePicker
    )
    // Notification tap opens the expanded controller (v4 parity).
    assertEquals(
      NitroExpandedControllerActivity::class.java.name,
      checkNotNull(mediaOptions.notificationOptions).targetActivityClassName
    )
  }

  @Test
  fun noAdditionalSessionProviders() {
    assertNull(provider.getAdditionalSessionProviders(context))
  }

  // MARK: - E7 subclass seams (override exactly one concern, rest intact)

  @Test
  fun subclassCanOverrideJustNotificationOptions() {
    setMetaData(null)
    val subclassed = object : NitroCastOptionsProvider() {
      override fun getNotificationOptions(context: Context): NotificationOptions? = null
    }
    val options = subclassed.getCastOptions(context)
    val mediaOptions = checkNotNull(options.castMediaOptions)
    assertNull(mediaOptions.notificationOptions)
    // Every other seam still produces the library defaults.
    assertEquals(CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID, options.receiverApplicationId)
    assertTrue(mediaOptions.imagePicker is NitroImagePicker)
    assertEquals(
      NitroExpandedControllerActivity::class.java.name,
      mediaOptions.expandedControllerActivityClassName
    )
  }

  @Test
  fun subclassCanOverrideJustReceiverApplicationId() {
    setMetaData(null)
    val subclassed = object : NitroCastOptionsProvider() {
      override fun getReceiverApplicationId(context: Context): String = "FEED0001"
    }
    val options = subclassed.getCastOptions(context)
    assertEquals("FEED0001", options.receiverApplicationId)
    assertNotNull(checkNotNull(options.castMediaOptions).notificationOptions)
  }

  @Test
  fun subclassCanOverrideJustImagePicker() {
    setMetaData(null)
    val subclassed = object : NitroCastOptionsProvider() {
      override fun getImagePicker(): ImagePicker? = null
    }
    val options = subclassed.getCastOptions(context)
    val mediaOptions = checkNotNull(options.castMediaOptions)
    assertNull(mediaOptions.imagePicker)
    // Every other seam still produces the library defaults.
    assertEquals(CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID, options.receiverApplicationId)
    assertNotNull(mediaOptions.notificationOptions)
    assertEquals(
      NitroExpandedControllerActivity::class.java.name,
      mediaOptions.expandedControllerActivityClassName
    )
  }

  // MARK: - NitroImagePicker shim (GCK-typed delegation over the pure heuristic)

  @Test
  fun imagePickerShimDelegatesToTheHeuristic() {
    val picker = NitroImagePicker()
    val first = WebImage(Uri.parse("https://example.com/0.png"))
    val second = WebImage(Uri.parse("https://example.com/1.png"))
    val metadata = MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE).apply {
      addImage(first)
      addImage(second)
    }

    val background = ImageHints(ImagePicker.IMAGE_TYPE_EXPANDED_CONTROLLER_BACKGROUND, 100, 100)
    assertEquals(second.url, checkNotNull(picker.onPickImage(metadata, background)).url)

    val castDialog = ImageHints(ImagePicker.IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND, 100, 100)
    assertEquals(first.url, checkNotNull(picker.onPickImage(metadata, castDialog)).url)

    val empty = MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE)
    assertNull(picker.onPickImage(empty, background))
    assertNull("null metadata picks nothing, gracefully", picker.onPickImage(null, background))
  }
}

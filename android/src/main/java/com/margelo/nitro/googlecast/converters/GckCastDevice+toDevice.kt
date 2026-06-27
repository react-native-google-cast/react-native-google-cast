package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.Device
import com.margelo.nitro.googlecast.DeviceCapability
import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.cast.CastDevice as GckCastDevice

/**
 * Converts a Google Cast [GckCastDevice] into a generated [Device] struct.
 *
 * This is the real, app-facing direction (devices always originate from GCK discovery). The
 * forward direction in `Device+toGckCastDevice.kt` exists only for the test seam and uses
 * reflection because `CastDevice` has no public constructor on Android.
 *
 * Capabilities are mapped from the `CAPABILITY_*` bitmask. Android only exposes
 * VIDEO_OUT/VIDEO_IN/AUDIO_OUT/AUDIO_IN/MULTIZONE_GROUP — our union's `DYNAMICGROUP` and
 * `MULTICHANNELGROUP` have no Android counterpart (iOS/Android reconciliation point).
 */
internal fun GckCastDevice.toDevice(): Device {
  val capabilities = mutableListOf<DeviceCapability>()
  if (hasCapability(GckCastDevice.CAPABILITY_VIDEO_OUT)) capabilities.add(DeviceCapability.VIDEOOUT)
  if (hasCapability(GckCastDevice.CAPABILITY_VIDEO_IN)) capabilities.add(DeviceCapability.VIDEOIN)
  if (hasCapability(GckCastDevice.CAPABILITY_AUDIO_OUT)) capabilities.add(DeviceCapability.AUDIOOUT)
  if (hasCapability(GckCastDevice.CAPABILITY_AUDIO_IN)) capabilities.add(DeviceCapability.AUDIOIN)
  if (hasCapability(GckCastDevice.CAPABILITY_MULTIZONE_GROUP)) capabilities.add(DeviceCapability.MULTIZONEGROUP)

  val mappedIcons = icons?.map { it.toWebImage() } ?: emptyList<WebImage>()

  return Device(
    capabilities = capabilities.toTypedArray(),
    deviceId = deviceId ?: "",
    deviceVersion = deviceVersion ?: "",
    friendlyName = friendlyName ?: "",
    icons = mappedIcons.toTypedArray(),
    ipAddress = ipAddress?.hostAddress ?: "",
    isOnLocalNetwork = isOnLocalNetwork,
    modelName = modelName ?: ""
  )
}

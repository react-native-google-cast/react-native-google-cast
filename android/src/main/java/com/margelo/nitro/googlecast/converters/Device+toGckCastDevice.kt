package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.Device
import com.margelo.nitro.googlecast.DeviceCapability
import com.google.android.gms.cast.CastDevice as GckCastDevice

/**
 * Converts a generated [Device] struct into a Google Cast [GckCastDevice].
 *
 * Test-seam only. `CastDevice` has no public constructor or builder on Android (it is
 * framework-created), so this uses its package-private 18-arg constructor via reflection. The
 * arg→field mapping was verified from bytecode: arg1 = deviceId, arg2 = ipAddress (also parsed
 * into the internal InetAddress), arg3 = friendlyName, arg4 = modelName, arg5 = deviceVersion,
 * arg7 = icons, arg8 = capabilities bitmask, arg16 = isOnLocalNetwork. Framework-internal args
 * (including the `zzaa` at arg17) are passed as defaults / `null`.
 *
 * Caveats for the deferred parity pass: (1) `ipAddress` must be a parseable address or the
 * constructor throws; (2) the capabilities bitmask routes through an internal type built with a
 * `null` `zzaa`, which may not survive at runtime; (3) `DYNAMICGROUP` / `MULTICHANNELGROUP`
 * have no Android capability constant and are dropped. The app-facing direction is
 * `GckCastDevice+toDevice.kt`.
 */
internal fun Device.toGckCastDevice(): GckCastDevice {
  var capabilityMask = 0
  for (capability in capabilities) {
    when (capability) {
      DeviceCapability.VIDEOOUT -> capabilityMask = capabilityMask or GckCastDevice.CAPABILITY_VIDEO_OUT
      DeviceCapability.VIDEOIN -> capabilityMask = capabilityMask or GckCastDevice.CAPABILITY_VIDEO_IN
      DeviceCapability.AUDIOOUT -> capabilityMask = capabilityMask or GckCastDevice.CAPABILITY_AUDIO_OUT
      DeviceCapability.AUDIOIN -> capabilityMask = capabilityMask or GckCastDevice.CAPABILITY_AUDIO_IN
      DeviceCapability.MULTIZONEGROUP -> capabilityMask = capabilityMask or GckCastDevice.CAPABILITY_MULTIZONE_GROUP
      DeviceCapability.DYNAMICGROUP -> Unit // no Android constant
      DeviceCapability.MULTICHANNELGROUP -> Unit // no Android constant
    }
  }

  val constructor = GckCastDevice::class.java.declaredConstructors
    .first { it.parameterTypes.size == 18 }
  constructor.isAccessible = true
  return constructor.newInstance(
    deviceId,                       // arg1 -> deviceId
    ipAddress,                      // arg2 -> ipAddress (+ internal InetAddress)
    friendlyName,                   // arg3 -> friendlyName
    modelName,                      // arg4 -> modelName
    deviceVersion,                  // arg5 -> deviceVersion
    0,                              // arg6 -> service port
    icons.map { it.toGckWebImage() }, // arg7 -> icons
    capabilityMask,                 // arg8 -> capabilities bitmask
    0,                              // arg9
    null,                           // arg10
    null,                           // arg11
    0,                              // arg12
    null,                           // arg13
    null,                           // arg14 (byte[])
    null,                           // arg15
    isOnLocalNetwork ?: false,      // arg16 -> isOnLocalNetwork
    null,                           // arg17 -> internal zzaa
    null                            // arg18 -> Integer
  ) as GckCastDevice
}

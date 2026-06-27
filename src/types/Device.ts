import type { WebImage } from './WebImage'

/**
 * A capability of a Cast receiver {@linkcode Device}.
 *
 * `DynamicGroup`, `MultizoneGroup`, and `MultiChannelGroup` are only reported on iOS.
 *
 * @see {@linkcode Device.capabilities}
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_device) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast#.Capability)
 */
export type DeviceCapability =
  | 'VideoOut'
  | 'VideoIn'
  | 'AudioOut'
  | 'AudioIn'
  | 'DynamicGroup'
  | 'MultizoneGroup'
  | 'MultiChannelGroup'

/**
 * A Cast receiver device.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_device) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Receiver)
 */
export interface Device {
  /** List of capabilities available on this device. */
  capabilities: DeviceCapability[]

  /** A unique identifier for the device. */
  deviceId: string

  /** The device's protocol version. */
  deviceVersion: string

  /** The device's friendly name. This is a user-assignable name such as "Living Room". */
  friendlyName: string

  /** A list of all of the device's icons. Empty if there are none. */
  icons: WebImage[]

  /** The device's IP address. IPv4 if available, otherwise IPv6. */
  ipAddress: string

  /** True if this device is on the local network. */
  isOnLocalNetwork?: boolean

  /** The model name for the device. */
  modelName: string
}

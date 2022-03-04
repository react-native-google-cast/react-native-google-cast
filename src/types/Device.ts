import WebImage from './WebImage'



/**
 * String representing a Cast receiver device's capabilties
 * "DynamicGroup" and "MultiChannelGroup" only available on iOS
 *
 * @see [Android](https://developers.google.cn/android/reference/com/google/android/gms/cast/CastDevice?hl=it-IT#hasCapabilities(int%5B%5D)) | [iOS](https://developers.google.cn/cast/docs/reference/ios/interface_g_c_k_device?hl=it-IT#ad2d54d60517308097ae26ff555062803) | [Chrome](https://developers.google.cn/cast/docs/reference/web_sender/chrome.cast?hl=it-IT#.Capability)
 */
export type DeviceCapability = "VideoOut" | "VideoIn" | "AudioOut" | "AudioIn" | "DynamicGroup" | "MultizoneGroup" | "MultiChannelGroup"

/**
 * An object representing a Cast receiver device.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_device) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.Receiver)
 */
export default interface Device {
  /** A unique identifier for the device. */
  deviceId: string

  /** The device's protocol version. */
  deviceVersion: string

  /** The device's friendly name. This is a user-assignable name such as "Living Room". */
  friendlyName: string

  /** Returns a list of all of the device's icons. If there are no images, returns an empty list. */
  icons: WebImage[]

  /** The device's IP address. IPv4 if available, otherwise IPv6. */
  ipAddress: string

  /** True if this device is on the local network. */
  isOnLocalNetwork?: boolean

  /** Gets the model name for the device. */
  modelName: string

  /** List of capabilities available on this device */
  capabilities: DeviceCapability[]
}

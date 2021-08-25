import { NativeEventEmitter, NativeModules } from 'react-native';
const {
  RNGCDiscoveryManager: Native
} = NativeModules;
const EventEmitter = new NativeEventEmitter(Native);
/**
 * A class that manages the device discovery process.
 *
 * The framework automatically starts the discovery process when the application moves to the foreground and suspends it when the application moves to the background. On iOS, it is possible to use `startDiscovery`/`stopDiscovery`, as an optimization measure to reduce network traffic and CPU utilization in areas of the application that do not use Cast functionality.
 *
 * If the application is using the framework's Cast dialog, then that dialog will use `DiscoveryManager` to populate its list of available devices. If however the application is providing its own device selection/control dialog UI, then it should use `getDevices` and `onDevicesUpdated` to populate and update its list of available devices.
 *
 * @see [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_discovery_manager) | [Android](https://developer.android.com/reference/androidx/mediarouter/media/MediaRouter)
 *
 * @example
 * ```ts
 * import GoogleCast from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const discoveryManager = GoogleCast.getDiscoveryManager()
 *   discoveryManager.startDiscovery()
 * }
 * ```
 */

export default class DiscoveryManager {
  /** List currently available devices. */
  getDevices() {
    return Native.getDevices();
  }
  /**
   * *(iOS only)* A flag indicating whether discovery should employ a "passive" scan. Passive scans are less resource-intensive but do not provide results that are as fresh as active scans.
   */


  isPassiveScan() {
    return Native.isPassiveScan();
  }
  /**
   * *(iOS only)* Check whether discovery is currently running, i.e. it either started automatically, or user initially pressed a Cast button, or `startDiscovery` has been called.
   */


  isRunning() {
    return Native.isRunning();
  }
  /**
   * Listen for changes to the list of devices.
   *
   * *Hint* Use the `useDevices` hook instead that manages `getDevices` and `onDevicesUpdated` for you.
   *
   * @example
   * ```js
   * const subscription = GoogleCast.getDiscoverManager().onDevicesUpdated(devices => {
   *   // ... display a list of devices
   * })
   *
   * // later, to stop listening
   * subscription.remove()
   * ```
   */


  onDevicesUpdated(listener) {
    return EventEmitter.addListener(Native.DEVICES_UPDATED, listener);
  }
  /** *(iOS only)* Set whether to use "passive" scan for discovery. */


  setPassiveScan(on) {
    return Native.setPassiveScan(on);
  }
  /**
   * *(iOS only)* Starts the device discovery process.
   */


  startDiscovery() {
    return Native.startDiscovery();
  }
  /**
   * *(iOS only)* Stops the device discovery process.
   */


  stopDiscovery() {
    return Native.stopDiscovery();
  }

}
//# sourceMappingURL=DiscoveryManager.js.map
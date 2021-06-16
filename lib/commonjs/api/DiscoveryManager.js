"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

const {
  RNGCDiscoveryManager: Native
} = _reactNative.NativeModules;
/**
 * A class that manages the device discovery process.
 *
 * This class is **iOS only**. On Android, the discovery process is handled automatically.
 *
 * The framework automatically starts the discovery process when the application moves to the foreground and suspends it when the application moves to the background. It is generally not necessary for the application to call startDiscovery and stopDiscovery, except as an optimization measure to reduce network traffic and CPU utilization in areas of the application that do not use Cast functionality.
 *
 * If the application is using the framework's Cast dialog, then that dialog will use DiscoveryManager to populate its list of available devices. If however the application is providing its own device selection/control dialog UI, then it should use the DiscoveryManager and its listeners to populate and update its list of available devices.
 *
 * @see [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_discovery_manager)
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

class DiscoveryManager {
  /**
   * Starts the device discovery process.
   */
  startDiscovery() {
    return Native.startDiscovery();
  }
  /**
   * Stops the device discovery process.
   */


  stopDiscovery() {
    return Native.stopDiscovery();
  }

}

exports.default = DiscoveryManager;
//# sourceMappingURL=DiscoveryManager.js.map
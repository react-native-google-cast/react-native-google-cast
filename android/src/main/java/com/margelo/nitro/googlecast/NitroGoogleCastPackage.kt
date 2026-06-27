package com.margelo.nitro.googlecast

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * React Native autolinking entry point for react-native-google-cast on Android.
 *
 * The Cast API is exposed as a Nitro HybridObject (registered in C++ via the
 * generated OnLoad), not as a TurboModule — so this package intentionally
 * provides no native modules or view managers. Its sole purpose is to load the
 * native library on construction, which triggers HybridObject registration
 * before any JS `createHybridObject('CastTransport')` call. This is what lets
 * consumers rely on autolinking with no manual MainApplication setup.
 */
class NitroGoogleCastPackage : ReactPackage {
  init {
    NitroGoogleCastOnLoad.initializeNative()
  }

  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> = emptyList()

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()
}

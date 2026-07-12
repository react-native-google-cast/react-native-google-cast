package com.margelo.nitro.googlecast

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.margelo.nitro.googlecast.views.HybridCastButtonManager

/**
 * React Native autolinking entry point for react-native-google-cast on Android.
 *
 * The Cast API is exposed as a Nitro HybridObject (registered in C++ via the
 * generated OnLoad), not as a TurboModule — so this package provides no native
 * modules; loading the native library on construction triggers HybridObject
 * registration before any JS `createHybridObject('CastTransport')` call. This
 * is what lets consumers rely on autolinking with no manual MainApplication
 * setup.
 *
 * Views are different (E1): nitrogen *generates* the `HybridCastButtonManager`
 * ViewManager but registers nothing into RN's ViewManager registry — neither
 * the generated autolinking nor `NitroModulesPackage` does. `<CastButton />`
 * therefore must be registered here; without it the button compiles clean and
 * fails only at runtime as an unimplemented component. (iOS needs no
 * counterpart — the generated `.mm` self-registers via `+load`.)
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
  ): List<ViewManager<*, *>> = listOf(HybridCastButtonManager())
}

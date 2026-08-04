import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleCast

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize the Google Cast context at launch (required before any
    // GCKCastContext.sharedInstance() access). v5 will inject this for consumers
    // via the Expo config plugin; the playground sets it up manually.
    //
    // EA48D3FC is the project's own PUBLISHED custom receiver, hosted from this
    // repo — see docs/internal/cast-receiver/README.md. The playground needs it
    // because the Default Media Receiver (kGCKDefaultMediaReceiverApplicationID)
    // structurally cannot answer a custom namespace, so the CastChannel rows
    // have nothing to test against. Being published, it launches on any
    // Chromecast with no device registration.
    //
    // This is a PLAYGROUND choice, not the one to copy: a consumer app should
    // use kGCKDefaultMediaReceiverApplicationID unless it owns a receiver.
    let criteria = GCKDiscoveryCriteria(applicationID: "EA48D3FC")
    let options = GCKCastOptions(discoveryCriteria: criteria)
    // Build B (Phase 6 device pass, S1.3): flip discovery autostart from an
    // untracked ios/local.xcconfig rather than by editing this file — an
    // uncommittable build setting is a control, "remember not to commit it"
    // is not. Unset (build A) leaves GCK's own default in place, which is what
    // CI and every Simulator build compile.
    if let autostart = Self.startDiscoveryAfterFirstTapOverride {
      options.startDiscoveryAfterFirstTapOnCastButton = autostart
      NSLog("[SPIKE] build B: startDiscoveryAfterFirstTapOnCastButton=\(autostart)")
    }
    GCKCastContext.setSharedInstanceWith(options)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "CastExample",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  /// `RNGCStartDiscoveryAfterFirstTapOnCastButton` from Info.plist, which the
  /// build substitutes from `$(RNGC_START_DISCOVERY_AFTER_FIRST_TAP)`.
  /// `nil` when unset/blank — the caller then leaves `GCKCastOptions` alone.
  private static var startDiscoveryAfterFirstTapOverride: Bool? {
    guard
      let raw = Bundle.main.object(
        forInfoDictionaryKey: "RNGCStartDiscoveryAfterFirstTapOnCastButton"
      ) as? String
    else { return nil }
    switch raw.trimmingCharacters(in: .whitespaces).lowercased() {
    case "yes", "true", "1": return true
    case "no", "false", "0": return false
    default: return nil
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

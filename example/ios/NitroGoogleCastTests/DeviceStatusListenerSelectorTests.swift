import XCTest

@testable import NitroGoogleCast

/// Guards the `GCKCastDeviceStatusListener` selector wiring in
/// `CastDeviceStatusListener`.
///
/// The two callbacks are *optional* protocol methods bridged from Objective-C: a
/// Swift signature that does not match the requirement compiles clean but is
/// assigned a *different* Obj-C selector, so GCK's `respondsToSelector:` never
/// finds it and the event silently never fires. The build cannot catch this — it
/// is exactly the "compiles-clean-but-silent" hazard the transport header warns
/// about. These assertions pin the runtime selectors to the ones GCK actually
/// calls (`castSession:didReceiveStandbyStatus:` /
/// `castSession:didReceiveActiveInputStatus:`), so a future signature drift or a
/// GCK-version rename fails here instead of going dark on-device.
final class DeviceStatusListenerSelectorTests: XCTestCase {
  func testRespondsToDeviceStatusSelectors() {
    // `instancesRespond(to:)` is a class-level query — it needs only the type
    // (reachable via `@testable import`), not an instance, so the test stays
    // decoupled from the listener's initializer.
    XCTAssertTrue(
      CastDeviceStatusListener.instancesRespond(
        to: NSSelectorFromString("castSession:didReceiveStandbyStatus:")),
      "standby-status callback is not wired to its GCK selector — it will silently never fire")
    XCTAssertTrue(
      CastDeviceStatusListener.instancesRespond(
        to: NSSelectorFromString("castSession:didReceiveActiveInputStatus:")),
      "active-input callback is not wired to its GCK selector — it will silently never fire")
  }
}

/// Guards the `GCKSessionManagerListener` selector wiring in
/// `CastSessionListener` — same compiles-clean-but-silent hazard as above.
///
/// All selectors below are copied verbatim from the GoogleCast 4.8.4
/// `GCKSessionManager.h` header (the ground truth GCK checks with
/// `respondsToSelector:`), so a signature drift in our Swift code or a GCK
/// rename fails here instead of going dark on-device.
final class SessionListenerSelectorTests: XCTestCase {
  /// v5-1o3: the suspend callback. The GCK optional requirement is
  /// `sessionManager:didSuspendSession:withReason:`, which imports into Swift as
  /// `sessionManager(_:didSuspend:with:)`. A `withReason:` argument label
  /// compiles clean but bridges to `sessionManager:didSuspend:withReason:` — a
  /// selector GCK never calls — so the `suspended` lifecycle event (and its
  /// media-listener teardown) would silently never fire.
  func testRespondsToSuspendSelector() {
    XCTAssertTrue(
      CastSessionListener.instancesRespond(
        to: NSSelectorFromString("sessionManager:didSuspendSession:withReason:")),
      "suspend callback is not wired to its GCK selector — it will silently never fire")
  }

  /// v5-8me.11 item 1: the five device-status callbacks `deviceStatusChanged`
  /// relies on (both `session:`/`castSession:` flavors of volume + status, plus
  /// `didUpdateDevice:`). A silent GCK rename would kill the event.
  func testRespondsToDeviceStatusSelectors() {
    let selectors = [
      "sessionManager:session:didReceiveDeviceVolume:muted:",
      "sessionManager:castSession:didReceiveDeviceVolume:muted:",
      "sessionManager:session:didReceiveDeviceStatus:",
      "sessionManager:castSession:didReceiveDeviceStatus:",
      "sessionManager:session:didUpdateDevice:",
    ]
    for selector in selectors {
      XCTAssertTrue(
        CastSessionListener.instancesRespond(to: NSSelectorFromString(selector)),
        "\(selector) is not wired to its GCK selector — deviceStatusChanged will silently miss it")
    }
  }

  /// The remaining lifecycle callbacks the transport depends on. These were
  /// already correct, but they share the same hazard — pin them all.
  func testRespondsToLifecycleSelectors() {
    let selectors = [
      "sessionManager:willStartSession:",
      "sessionManager:didStartSession:",
      "sessionManager:didFailToStartSession:withError:",
      "sessionManager:willEndSession:",
      "sessionManager:didEndSession:withError:",
      "sessionManager:willResumeSession:",
      "sessionManager:didResumeSession:",
    ]
    for selector in selectors {
      XCTAssertTrue(
        CastSessionListener.instancesRespond(to: NSSelectorFromString(selector)),
        "\(selector) is not wired to its GCK selector — the lifecycle event will silently never fire")
    }
  }
}

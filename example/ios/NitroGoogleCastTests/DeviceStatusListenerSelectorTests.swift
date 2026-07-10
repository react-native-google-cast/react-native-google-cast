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

import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the standalone state enums (ActiveInputState, StandbyState) — iOS side of
/// T1. These map to `GCKActiveInputStatus` / `GCKStandbyStatus` by value.
///
/// The enum types are only reachable from this test module via Swift/C++ interop SPI (they are
/// referenced solely by HybridObject spec signatures, so Swift marks them `@_spi`). The test
/// therefore drives the real converters through `StateEnumProbe`, an `internal` string-based
/// seam visible via `@testable import`, so it never has to name the enum type directly.
///
/// PlayServicesState has no iOS GCK counterpart (Android-only) and is not exercised here.
final class StateEnumConverterTests: XCTestCase {
  /// GCK values for both `GCKActiveInputStatus` and `GCKStandbyStatus`: Unknown=-1, Inactive=0,
  /// Active=1.
  private let stateRaw: [String: Int] = ["unknown": -1, "inactive": 0, "active": 1]

  func testActiveInputStateRoundTrips() {
    for value in ["unknown", "inactive", "active"] {
      XCTAssertEqual(
        StateEnumProbe.gckActiveInputRawValue(value), stateRaw[value],
        "[\(value)] gck ActiveInputStatus value")
      XCTAssertEqual(
        StateEnumProbe.roundTripActiveInputState(value), value,
        "[\(value)] ActiveInputState round-trip")
    }
  }

  func testStandbyStateRoundTrips() {
    for value in ["unknown", "inactive", "active"] {
      XCTAssertEqual(
        StateEnumProbe.gckStandbyRawValue(value), stateRaw[value],
        "[\(value)] gck StandbyStatus value")
      XCTAssertEqual(
        StateEnumProbe.roundTripStandbyState(value), value, "[\(value)] StandbyState round-trip")
    }
  }
}

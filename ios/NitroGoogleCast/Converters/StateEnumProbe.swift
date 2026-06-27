import Foundation
import GoogleCast

/// Test seam for the standalone state enums (`ActiveInputState`, `StandbyState`).
///
/// Those enums are reachable from the XCTest module only via Swift/C++ interop SPI (they are
/// referenced solely by HybridObject spec method signatures, never by a struct, so Swift marks
/// them `@_spi` in the module interface and the test cannot name the type). This `internal`
/// seam — visible to the suite through `@testable import` — exercises the real converters and
/// returns plain `String`/`Int`, so the parity test never has to name the enum type.
enum StateEnumProbe {
  static func roundTripActiveInputState(_ value: String) -> String? {
    ActiveInputState(fromString: value)
      .map { $0.toGckActiveInputStatus().toActiveInputState().stringValue }
  }

  static func gckActiveInputRawValue(_ value: String) -> Int? {
    ActiveInputState(fromString: value).map { Int($0.toGckActiveInputStatus().rawValue) }
  }

  static func roundTripStandbyState(_ value: String) -> String? {
    StandbyState(fromString: value)
      .map { $0.toGckStandbyStatus().toStandbyState().stringValue }
  }

  static func gckStandbyRawValue(_ value: String) -> Int? {
    StandbyState(fromString: value).map { Int($0.toGckStandbyStatus().rawValue) }
  }
}

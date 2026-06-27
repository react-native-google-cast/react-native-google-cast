import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the VideoInfo struct↔GCK converter (iOS side of T1).
///
/// `GCKVideoInfo` is receive-only; the struct→GCK direction is a debug-seam KVC constructor
/// used only to exercise the production reverse converter.
final class VideoInfoConverterTests: XCTestCase {
  private let hdrRaw: [String: Int] = ["SDR": 0, "DV": 1, "HDR": 2]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("videoInfo")
    XCTAssertFalse(fixtures.isEmpty, "videoInfo corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.videoInfo(from: fixture.input)
      let expected = ConverterFixtures.videoInfo(from: fixture.expectedRoundTrip)

      let gck = input.toGckVideoInfo()
      if let width = ConverterFixtures.number(fixture.input["width"]) {
        XCTAssertEqual(Int(gck.width), Int(width), "[\(fixture.name)] gck width")
      }
      if let hdrType = fixture.input["hdrType"] as? String {
        XCTAssertEqual(gck.hdrType.rawValue, hdrRaw[hdrType], "[\(fixture.name)] gck hdrType value")
      }

      let actual = gck.toVideoInfo()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] videoInfo")
    }
  }
}

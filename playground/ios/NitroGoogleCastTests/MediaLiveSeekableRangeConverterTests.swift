import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaLiveSeekableRange struct↔GCK converter (iOS side of T1).
///
/// `GCKMediaLiveSeekableRange` is receive-only; the struct→GCK direction is a debug-seam KVC
/// constructor used only to exercise the production reverse converter.
final class MediaLiveSeekableRangeConverterTests: XCTestCase {
  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaLiveSeekableRange")
    XCTAssertFalse(fixtures.isEmpty, "mediaLiveSeekableRange corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaLiveSeekableRange(from: fixture.input)
      let expected = ConverterFixtures.mediaLiveSeekableRange(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaLiveSeekableRange()
      if let endTime = ConverterFixtures.number(fixture.input["endTime"]) {
        XCTAssertEqual(gck.endTime, endTime, accuracy: 1e-9, "[\(fixture.name)] gck endTime")
      }
      if let isLiveDone = fixture.input["isLiveDone"] as? Bool {
        XCTAssertEqual(gck.isLiveDone, isLiveDone, "[\(fixture.name)] gck isLiveDone")
      }

      let actual = gck.toMediaLiveSeekableRange()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaLiveSeekableRange")
    }
  }
}

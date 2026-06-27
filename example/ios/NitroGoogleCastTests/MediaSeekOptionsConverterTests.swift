import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaSeekOptions struct↔GCK converter (iOS side of T1).
final class MediaSeekOptionsConverterTests: XCTestCase {
  /// Independent oracle of GCK's resume-state enum VALUES.
  private let resumeStateRaw: [String: Int] = ["play": 1, "pause": 2]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaSeekOptions")
    XCTAssertFalse(fixtures.isEmpty, "mediaSeekOptions corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaSeekOptions(from: fixture.input)
      let expected = ConverterFixtures.mediaSeekOptions(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaSeekOptions()
      if let position = ConverterFixtures.number(fixture.input["position"]) {
        XCTAssertEqual(gck.interval, position, accuracy: 1e-9, "[\(fixture.name)] gck interval")
      }
      if let resumeState = fixture.input["resumeState"] as? String {
        XCTAssertEqual(
          gck.resumeState.rawValue, resumeStateRaw[resumeState],
          "[\(fixture.name)] gck resumeState value")
      }

      let actual = gck.toMediaSeekOptions()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaSeekOptions")
    }
  }
}

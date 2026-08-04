import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaStatus struct↔GCK converter (iOS side of T1).
///
/// `GCKMediaStatus` is effectively receive-only (only `initWithSessionID:mediaInformation:` is
/// public); the struct→GCK direction is a debug-seam constructor (init + KVC) used only to
/// exercise the production reverse converter.
final class MediaStatusConverterTests: XCTestCase {
  private let playerStateRaw: [String: Int] = [
    "idle": 1, "playing": 2, "paused": 3, "buffering": 4, "loading": 5,
  ]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaStatus")
    XCTAssertFalse(fixtures.isEmpty, "mediaStatus corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaStatus(from: fixture.input)
      let expected = ConverterFixtures.mediaStatus(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaStatus()
      if let playerState = fixture.input["playerState"] as? String {
        XCTAssertEqual(
          gck.playerState.rawValue, playerStateRaw[playerState],
          "[\(fixture.name)] gck playerState value")
      }
      if let streamPosition = ConverterFixtures.number(fixture.input["streamPosition"]) {
        XCTAssertEqual(
          gck.streamPosition, streamPosition, accuracy: 1e-9, "[\(fixture.name)] gck streamPosition")
      }

      let actual = gck.toMediaStatus()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaStatus")
    }
  }
}

import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaQueueData struct↔GCK converter (iOS side of T1).
final class MediaQueueDataConverterTests: XCTestCase {
  /// Independent oracle of GCK's queue-type / repeat-mode enum VALUES.
  private let queueTypeRaw: [String: Int] = [
    "album": 1, "playlist": 2, "audioBook": 3, "radioStation": 4, "podcastSeries": 5,
    "tvSeries": 6, "videoPlaylist": 7, "liveTv": 8, "movie": 9,
  ]
  private let repeatModeRaw: [String: Int] = [
    "off": 1, "single": 2, "all": 3, "allAndShuffle": 4,
  ]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaQueueData")
    XCTAssertFalse(fixtures.isEmpty, "mediaQueueData corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaQueueData(from: fixture.input)
      let expected = ConverterFixtures.mediaQueueData(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaQueueData()
      if let type = fixture.input["type"] as? String {
        XCTAssertEqual(gck.queueType.rawValue, queueTypeRaw[type], "[\(fixture.name)] gck queueType")
      }
      if let repeatMode = fixture.input["repeatMode"] as? String {
        XCTAssertEqual(
          gck.repeatMode.rawValue, repeatModeRaw[repeatMode], "[\(fixture.name)] gck repeatMode")
      }

      let actual = gck.toMediaQueueData()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaQueueData")
    }
  }
}

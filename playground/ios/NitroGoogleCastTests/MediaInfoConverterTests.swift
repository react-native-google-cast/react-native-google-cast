import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaInfo struct↔GCK converter (iOS side of T1).
final class MediaInfoConverterTests: XCTestCase {
  /// Independent oracle of GCK's stream-type / HLS enum VALUES.
  private let streamTypeRaw: [String: Int] = ["buffered": 1, "live": 2, "other": 0]
  private let hlsSegmentRaw: [String: Int] = [
    "AAC": 1, "AC3": 2, "MP3": 3, "TS": 4, "TS_AAC": 5, "E-AC3": 6, "FMP4": 7,
  ]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaInfo")
    XCTAssertFalse(fixtures.isEmpty, "mediaInfo corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaInfo(from: fixture.input)
      let expected = ConverterFixtures.mediaInfo(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaInformation()
      XCTAssertEqual(
        gck.contentURL?.absoluteString, fixture.input["contentUrl"] as? String,
        "[\(fixture.name)] gck contentURL")
      if let streamType = fixture.input["streamType"] as? String {
        XCTAssertEqual(
          gck.streamType.rawValue, streamTypeRaw[streamType], "[\(fixture.name)] gck streamType")
      }
      if let hls = fixture.input["hlsSegmentFormat"] as? String {
        XCTAssertEqual(
          gck.hlsSegmentFormat.rawValue, hlsSegmentRaw[hls], "[\(fixture.name)] gck hlsSegmentFormat")
      }

      let actual = gck.toMediaInfo()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaInfo")
    }
  }
}

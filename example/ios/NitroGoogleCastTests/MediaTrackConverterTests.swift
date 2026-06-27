import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaTrack struct↔GCK converter (iOS side of T1).
final class MediaTrackConverterTests: XCTestCase {
  /// Independent oracle of GCK's track-type / subtype enum VALUES (not routed through the
  /// converter under test), so an ordinal-mapping regression is caught.
  private let trackTypeRaw: [String: Int] = ["text": 1, "audio": 2, "video": 3]
  private let subtypeRaw: [String: Int] = [
    "subtitles": 1, "captions": 3, "descriptions": 4, "chapters": 5, "metadata": 6,
  ]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaTrack")
    XCTAssertFalse(fixtures.isEmpty, "mediaTrack corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaTrack(from: fixture.input)
      let expected = ConverterFixtures.mediaTrack(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaTrack()
      pinGckSide(gck, against: fixture.input, name: fixture.name)

      let actual = gck.toMediaTrack()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaTrack")
    }
  }

  private func pinGckSide(_ gck: GCKMediaTrack, against input: [String: Any], name: String) {
    XCTAssertEqual(
      gck.identifier, Int(ConverterFixtures.number(input["id"]) ?? -1), "[\(name)] gck identifier")
    if let type = input["type"] as? String {
      XCTAssertEqual(gck.type.rawValue, trackTypeRaw[type], "[\(name)] gck type value")
    }
    if let subtype = input["subtype"] as? String {
      XCTAssertEqual(gck.textSubtype.rawValue, subtypeRaw[subtype], "[\(name)] gck subtype value")
    }
    if let contentType = input["contentType"] as? String {
      XCTAssertEqual(gck.contentType, contentType, "[\(name)] gck contentType")
    }
  }
}

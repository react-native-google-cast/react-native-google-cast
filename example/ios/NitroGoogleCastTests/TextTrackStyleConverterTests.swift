import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the TextTrackStyle struct↔GCK converter (iOS side of T1).
final class TextTrackStyleConverterTests: XCTestCase {
  /// Independent oracles of GCK's text-track-style enum VALUES.
  private let edgeTypeRaw: [String: Int] = [
    "none": 0, "outline": 1, "dropShadow": 2, "raised": 3, "depressed": 4,
  ]
  private let windowTypeRaw: [String: Int] = ["none": 0, "normal": 1, "rounded": 2]
  private let fontStyleRaw: [String: Int] = [
    "normal": 0, "bold": 1, "italic": 2, "boldItalic": 3,
  ]
  private let fontGenericFamilyRaw: [String: Int] = [
    "sansSerif": 1, "monoSansSerif": 2, "serif": 3, "monoSerif": 4, "casual": 5, "cursive": 6,
    "smallCaps": 7,
  ]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("textTrackStyle")
    XCTAssertFalse(fixtures.isEmpty, "textTrackStyle corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.textTrackStyle(from: fixture.input)
      let expected = ConverterFixtures.textTrackStyle(from: fixture.expectedRoundTrip)

      let gck = input.toGckTextTrackStyle()
      pinGckSide(gck, against: fixture.input, name: fixture.name)

      let actual = gck.toTextTrackStyle()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] textTrackStyle")
    }
  }

  private func pinGckSide(
    _ gck: GCKMediaTextTrackStyle, against input: [String: Any], name: String
  ) {
    if let edgeType = input["edgeType"] as? String {
      XCTAssertEqual(gck.edgeType.rawValue, edgeTypeRaw[edgeType], "[\(name)] gck edgeType value")
    }
    if let windowType = input["windowType"] as? String {
      XCTAssertEqual(
        gck.windowType.rawValue, windowTypeRaw[windowType], "[\(name)] gck windowType value")
    }
    if let fontStyle = input["fontStyle"] as? String {
      XCTAssertEqual(
        gck.fontStyle.rawValue, fontStyleRaw[fontStyle], "[\(name)] gck fontStyle value")
    }
    if let fontGenericFamily = input["fontGenericFamily"] as? String {
      XCTAssertEqual(
        gck.fontGenericFamily.rawValue, fontGenericFamilyRaw[fontGenericFamily],
        "[\(name)] gck fontGenericFamily value")
    }
    if let fontScale = ConverterFixtures.number(input["fontScale"]) {
      XCTAssertEqual(Double(gck.fontScale), fontScale, accuracy: 1e-9, "[\(name)] gck fontScale")
    }
  }
}

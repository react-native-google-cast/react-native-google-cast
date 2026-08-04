import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaQueueContainerMetadata struct↔GCK converter (iOS side of T1).
final class MediaQueueContainerMetadataConverterTests: XCTestCase {
  private let containerTypeRaw: [String: Int] = ["generic": 0, "audioBook": 1]

  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaQueueContainerMetadata")
    XCTAssertFalse(fixtures.isEmpty, "mediaQueueContainerMetadata corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaQueueContainerMetadata(from: fixture.input)
      let expected = ConverterFixtures.mediaQueueContainerMetadata(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaQueueContainerMetadata()
      if let containerType = fixture.input["containerType"] as? String {
        XCTAssertEqual(
          gck.containerType.rawValue, containerTypeRaw[containerType],
          "[\(fixture.name)] gck containerType value")
      }
      if let title = fixture.input["title"] as? String {
        XCTAssertEqual(gck.title, title, "[\(fixture.name)] gck title")
      }

      let actual = gck.toMediaQueueContainerMetadata()
      ConverterAssertions.assertEqual(
        actual, expected, "[\(fixture.name)] mediaQueueContainerMetadata")
    }
  }
}

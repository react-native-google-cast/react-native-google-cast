import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaQueueItem struct↔GCK converter (iOS side of T1).
final class MediaQueueItemConverterTests: XCTestCase {
  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaQueueItem")
    XCTAssertFalse(fixtures.isEmpty, "mediaQueueItem corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaQueueItem(from: fixture.input)
      let expected = ConverterFixtures.mediaQueueItem(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaQueueItem()
      if let autoplay = fixture.input["autoplay"] as? Bool {
        XCTAssertEqual(gck.autoplay, autoplay, "[\(fixture.name)] gck autoplay")
      }
      if let mediaInfo = fixture.input["mediaInfo"] as? [String: Any],
        let contentUrl = mediaInfo["contentUrl"] as? String
      {
        XCTAssertEqual(
          gck.mediaInformation.contentURL?.absoluteString, contentUrl,
          "[\(fixture.name)] gck mediaInformation.contentURL")
      }

      let actual = gck.toMediaQueueItem()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaQueueItem")
    }
  }
}

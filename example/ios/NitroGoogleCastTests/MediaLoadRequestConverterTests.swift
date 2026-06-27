import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaLoadRequest struct↔GCK converter (iOS side of T1).
final class MediaLoadRequestConverterTests: XCTestCase {
  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaLoadRequest")
    XCTAssertFalse(fixtures.isEmpty, "mediaLoadRequest corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaLoadRequest(from: fixture.input)
      let expected = ConverterFixtures.mediaLoadRequest(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaLoadRequestData()
      if let autoplay = fixture.input["autoplay"] as? Bool {
        XCTAssertEqual(gck.autoplay?.boolValue, autoplay, "[\(fixture.name)] gck autoplay")
      }
      if let credentials = fixture.input["credentials"] as? String {
        XCTAssertEqual(gck.credentials, credentials, "[\(fixture.name)] gck credentials")
      }

      let actual = gck.toMediaLoadRequest()
      ConverterAssertions.assertEqual(actual, expected, "[\(fixture.name)] mediaLoadRequest")
    }
  }
}

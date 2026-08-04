import GoogleCast
import XCTest

@testable import NitroGoogleCast

/// Parity test for the WebImage struct↔GCK converter (iOS side of T1).
///
/// Mirrors the Android Robolectric suite: drives each fixture through
/// `struct → GCK → struct`, pins the GCK-side values directly (catching symmetric mapping
/// bugs), then asserts the result deep-equals the corpus `expectedRoundTrip`. Both platforms
/// assert against the same shared JSON, giving the cross-platform guarantee.
final class WebImageConverterTests: XCTestCase {
  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("webImage")
    XCTAssertFalse(fixtures.isEmpty, "webImage corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.webImage(from: fixture.input)
      let expected = ConverterFixtures.webImage(from: fixture.expectedRoundTrip)

      // Pin the GCK side directly to catch symmetric (both-directions) mapping bugs.
      let gck = input.toGckImage()
      XCTAssertEqual(gck.url.absoluteString, expected.url, "[\(fixture.name)] gck url")
      XCTAssertEqual(Double(gck.width), expected.width, "[\(fixture.name)] gck width")
      XCTAssertEqual(Double(gck.height), expected.height, "[\(fixture.name)] gck height")

      // Full round-trip identity against the shared corpus.
      let actual = gck.toWebImage()
      XCTAssertEqual(actual.url, expected.url, "[\(fixture.name)] url")
      XCTAssertEqual(actual.width, expected.width, "[\(fixture.name)] width")
      XCTAssertEqual(actual.height, expected.height, "[\(fixture.name)] height")
    }
  }

  /// Resolves the open question behind the `no-dimensions` fixture: `GCKImage` documents
  /// that it raises `NSInvalidArgumentException` for "invalid" dimensions. This asserts that
  /// zero width/height is accepted (not treated as invalid), which the WebImage converter
  /// relies on when mapping absent dimensions to `0`.
  func testGckImageAcceptsZeroDimensions() {
    var image: GCKImage?
    XCTAssertNoThrow(
      try ObjCExceptionCatcher.catchExceptions {
        image = GCKImage(url: URL(string: "https://example.com/icon.png")!, width: 0, height: 0)
      },
      "GCKImage rejected zero width/height")
    XCTAssertEqual(image?.width, 0)
    XCTAssertEqual(image?.height, 0)
  }
}

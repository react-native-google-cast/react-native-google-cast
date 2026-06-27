import GoogleCast
import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Parity test for the MediaMetadata struct↔GCK converter (iOS side of T1).
///
/// This is the reference converter for the T1 fan-out. For each fixture it:
///  1. builds the struct from `input`,
///  2. runs `.toGckMediaMetadata()` and PINS the GCK-side values directly (typed per field),
///     which catches symmetric mapping bugs that a round-trip identity check alone misses,
///  3. runs `.toMediaMetadata()` and asserts it deep-equals `expectedRoundTrip`.
final class MediaMetadataConverterTests: XCTestCase {
  func testRoundTripsAllFixtures() {
    let fixtures = ConverterFixtures.load("mediaMetadata")
    XCTAssertFalse(fixtures.isEmpty, "mediaMetadata corpus is empty")

    for fixture in fixtures {
      let input = ConverterFixtures.mediaMetadata(from: fixture.input)
      let expected = ConverterFixtures.mediaMetadata(from: fixture.expectedRoundTrip)

      let gck = input.toGckMediaMetadata()
      pinGckSide(gck, against: fixture.input, name: fixture.name)

      let actual = gck.toMediaMetadata()
      assertEqual(actual, expected, name: fixture.name)
    }
  }

  // MARK: - GCK-side pins (symmetric-mapping bug detector)

  private let stringFields: [String: String] = [
    "title": kGCKMetadataKeyTitle, "subtitle": kGCKMetadataKeySubtitle,
    "artist": kGCKMetadataKeyArtist, "studio": kGCKMetadataKeyStudio,
    "albumTitle": kGCKMetadataKeyAlbumTitle, "albumArtist": kGCKMetadataKeyAlbumArtist,
    "composer": kGCKMetadataKeyComposer, "location": kGCKMetadataKeyLocationName,
    "seriesTitle": kGCKMetadataKeySeriesTitle,
  ]
  private let integerFields: [String: String] = [
    "discNumber": kGCKMetadataKeyDiscNumber, "trackNumber": kGCKMetadataKeyTrackNumber,
    "width": kGCKMetadataKeyWidth, "height": kGCKMetadataKeyHeight,
    "episodeNumber": kGCKMetadataKeyEpisodeNumber, "seasonNumber": kGCKMetadataKeySeasonNumber,
  ]
  private let doubleFields: [String: String] = [
    "latitude": kGCKMetadataKeyLocationLatitude, "longitude": kGCKMetadataKeyLocationLongitude,
  ]
  private let dateFields: [String: String] = [
    "releaseDate": kGCKMetadataKeyReleaseDate, "creationDate": kGCKMetadataKeyCreationDate,
    "broadcastDate": kGCKMetadataKeyBroadcastDate,
  ]

  /// Independent hardcoded oracle of GCK's metadata-type enum VALUES. Pinning against this
  /// (rather than against `toGckMetadataType()`, the function under test) is what makes the
  /// gate catch a symmetric ordinal-mapping regression: our union ordinals differ from GCK's
  /// values, so an ordinal cast would corrupt the on-the-wire type while still surviving a
  /// round-trip identity check. Do NOT route this through the converter.
  private let expectedGckRawValue: [String: Int] = [
    "generic": 0, "movie": 1, "tvShow": 2, "musicTrack": 3, "photo": 4, "user": 100,
  ]

  private func pinGckSide(_ gck: GCKMediaMetadata, against input: [String: Any], name: String) {
    let typeString = input["type"] as? String ?? "generic"
    XCTAssertEqual(
      Int(gck.metadataType.rawValue), expectedGckRawValue[typeString],
      "[\(name)] gck metadataType value")

    for (field, key) in stringFields {
      if let value = input[field] as? String {
        XCTAssertEqual(gck.string(forKey: key), value, "[\(name)] gck \(field)")
      }
    }
    for (field, key) in integerFields {
      if let value = ConverterFixtures.number(input[field]) {
        XCTAssertEqual(gck.integer(forKey: key), Int(value), "[\(name)] gck \(field)")
      }
    }
    for (field, key) in doubleFields {
      if let value = ConverterFixtures.number(input[field]) {
        XCTAssertEqual(gck.double(forKey: key), value, accuracy: 1e-9, "[\(name)] gck \(field)")
      }
    }
    for (field, key) in dateFields where input[field] != nil {
      XCTAssertTrue(gck.containsKey(key), "[\(name)] gck \(field) key present")
    }

    if let images = input["images"] as? [[String: Any]] {
      XCTAssertEqual((gck.images() as? [GCKImage])?.count, images.count, "[\(name)] gck images")
    }

    if let customData = input["customData"] as? [String: Any] {
      for (key, raw) in customData {
        if let string = raw as? String {
          XCTAssertEqual(gck.string(forKey: key), string, "[\(name)] gck custom \(key)")
        } else if let n = raw as? NSNumber {
          XCTAssertEqual(
            gck.double(forKey: key), n.doubleValue, accuracy: 1e-9, "[\(name)] gck custom \(key)")
        }
      }
    }
  }

  // MARK: - Deep equality vs expectedRoundTrip

  private func assertEqual(_ actual: MediaMetadata, _ expected: MediaMetadata, name: String) {
    XCTAssertEqual(actual.type.stringValue, expected.type.stringValue, "[\(name)] type")

    XCTAssertEqual(actual.title, expected.title, "[\(name)] title")
    XCTAssertEqual(actual.subtitle, expected.subtitle, "[\(name)] subtitle")
    XCTAssertEqual(actual.artist, expected.artist, "[\(name)] artist")
    XCTAssertEqual(actual.releaseDate, expected.releaseDate, "[\(name)] releaseDate")
    XCTAssertEqual(actual.studio, expected.studio, "[\(name)] studio")
    XCTAssertEqual(actual.albumTitle, expected.albumTitle, "[\(name)] albumTitle")
    XCTAssertEqual(actual.albumArtist, expected.albumArtist, "[\(name)] albumArtist")
    XCTAssertEqual(actual.composer, expected.composer, "[\(name)] composer")
    XCTAssertEqual(actual.discNumber, expected.discNumber, "[\(name)] discNumber")
    XCTAssertEqual(actual.trackNumber, expected.trackNumber, "[\(name)] trackNumber")
    XCTAssertEqual(actual.creationDate, expected.creationDate, "[\(name)] creationDate")
    XCTAssertEqual(actual.location, expected.location, "[\(name)] location")
    XCTAssertEqual(actual.latitude, expected.latitude, "[\(name)] latitude")
    XCTAssertEqual(actual.longitude, expected.longitude, "[\(name)] longitude")
    XCTAssertEqual(actual.width, expected.width, "[\(name)] width")
    XCTAssertEqual(actual.height, expected.height, "[\(name)] height")
    XCTAssertEqual(actual.broadcastDate, expected.broadcastDate, "[\(name)] broadcastDate")
    XCTAssertEqual(actual.episodeNumber, expected.episodeNumber, "[\(name)] episodeNumber")
    XCTAssertEqual(actual.seasonNumber, expected.seasonNumber, "[\(name)] seasonNumber")
    XCTAssertEqual(actual.seriesTitle, expected.seriesTitle, "[\(name)] seriesTitle")

    assertImagesEqual(actual.images, expected.images, name: name)
    assertCustomDataEqual(actual.customData, expected.customData, name: name)
  }

  private func assertImagesEqual(_ actual: [WebImage]?, _ expected: [WebImage]?, name: String) {
    XCTAssertEqual(actual?.count, expected?.count, "[\(name)] images count")
    guard let actual, let expected, actual.count == expected.count else { return }
    for (index, pair) in zip(actual, expected).enumerated() {
      XCTAssertEqual(pair.0.url, pair.1.url, "[\(name)] images[\(index)] url")
      XCTAssertEqual(pair.0.width, pair.1.width, "[\(name)] images[\(index)] width")
      XCTAssertEqual(pair.0.height, pair.1.height, "[\(name)] images[\(index)] height")
    }
  }

  private func assertCustomDataEqual(_ actual: AnyMap?, _ expected: AnyMap?, name: String) {
    if actual == nil && expected == nil { return }
    guard let actual, let expected else {
      XCTFail("[\(name)] customData presence mismatch (actual: \(actual != nil))")
      return
    }
    let actualKeys = Set(actual.getAllKeys())
    let expectedKeys = Set(expected.getAllKeys())
    XCTAssertEqual(actualKeys, expectedKeys, "[\(name)] customData keys")
    for key in expectedKeys.intersection(actualKeys) {
      if expected.isString(key: key) {
        XCTAssertTrue(actual.isString(key: key), "[\(name)] customData \(key) type")
        XCTAssertEqual(
          actual.getString(key: key), expected.getString(key: key), "[\(name)] customData \(key)")
      } else if expected.isDouble(key: key) {
        XCTAssertTrue(actual.isDouble(key: key), "[\(name)] customData \(key) type")
        XCTAssertEqual(
          actual.getDouble(key: key), expected.getDouble(key: key), accuracy: 1e-9,
          "[\(name)] customData \(key)")
      }
    }
  }
}

import Foundation
import NitroModules

@testable import NitroGoogleCast

/// Loads the shared golden-fixture corpus (the JSON files under repo-root
/// `fixtures/converters`, copied into the test bundle) and builds generated structs from
/// the JSON. The same files are consumed by the Android suite, so the expected values are
/// the single cross-platform source of truth.
enum ConverterFixtures {
  struct Fixture {
    let name: String
    let input: [String: Any]
    let expectedRoundTrip: [String: Any]
  }

  /// Loads the `fixtures` array from `<name>.json` in the test bundle.
  static func load(_ name: String) -> [Fixture] {
    guard
      let url = Bundle(for: BundleToken.self).url(forResource: name, withExtension: "json")
    else {
      fatalError("Fixture resource \(name).json not found in test bundle")
    }
    guard
      let data = try? Data(contentsOf: url),
      let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let fixtures = root["fixtures"] as? [[String: Any]]
    else {
      fatalError("Fixture \(name).json is malformed")
    }
    return fixtures.map { fixture in
      Fixture(
        name: fixture["name"] as? String ?? "<unnamed>",
        input: fixture["input"] as? [String: Any] ?? [:],
        expectedRoundTrip: fixture["expectedRoundTrip"] as? [String: Any] ?? [:]
      )
    }
  }

  // MARK: - Struct builders

  static func webImage(from json: [String: Any]) -> WebImage {
    return WebImage(
      url: json["url"] as? String ?? "",
      width: number(json["width"]),
      height: number(json["height"])
    )
  }

  static func mediaMetadata(from json: [String: Any]) -> MediaMetadata {
    let typeString = json["type"] as? String ?? "generic"
    let type = MediaMetadataType(fromString: typeString) ?? .generic
    let images = (json["images"] as? [[String: Any]])?.map { webImage(from: $0) }
    return MediaMetadata(
      type: type,
      images: images,
      title: json["title"] as? String,
      subtitle: json["subtitle"] as? String,
      artist: json["artist"] as? String,
      releaseDate: json["releaseDate"] as? String,
      studio: json["studio"] as? String,
      albumTitle: json["albumTitle"] as? String,
      albumArtist: json["albumArtist"] as? String,
      composer: json["composer"] as? String,
      discNumber: number(json["discNumber"]),
      trackNumber: number(json["trackNumber"]),
      creationDate: json["creationDate"] as? String,
      location: json["location"] as? String,
      latitude: number(json["latitude"]),
      longitude: number(json["longitude"]),
      width: number(json["width"]),
      height: number(json["height"]),
      broadcastDate: json["broadcastDate"] as? String,
      episodeNumber: number(json["episodeNumber"]),
      seasonNumber: number(json["seasonNumber"]),
      seriesTitle: json["seriesTitle"] as? String,
      customData: anyMap(json["customData"])
    )
  }

  // MARK: - Helpers

  static func number(_ value: Any?) -> Double? {
    return (value as? NSNumber)?.doubleValue
  }

  /// Builds an `AnyMap` from a JSON object (string → string, number → double).
  static func anyMap(_ value: Any?) -> AnyMap? {
    guard let dict = value as? [String: Any] else {
      return nil
    }
    let map = AnyMap()
    for (key, raw) in dict {
      if let string = raw as? String {
        map.setString(key: key, value: string)
      } else if let n = raw as? NSNumber {
        map.setDouble(key: key, value: n.doubleValue)
      }
    }
    return map
  }
}

/// Anchors `Bundle(for:)` to the test bundle.
private final class BundleToken {}

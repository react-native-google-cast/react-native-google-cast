import Foundation
import NitroModules

/// Bridges an `AnyMap` (the generated `customData` field type) to/from the opaque
/// `id customData` carried by most GCK media model objects (`GCKMediaInformation`,
/// `GCKMediaTrack`, `GCKMediaQueueItem`, …). Unlike `GCKMediaMetadata`, which stores custom
/// keys directly in its keyed bag, these types hold `customData` as a single JSON-compatible
/// object (typically an `NSDictionary`).
///
/// Mapping rule (kept symmetric and cross-platform deterministic): each entry is converted by
/// scalar type — string → string, bool → bool, integer/double → double. Numbers collapse to
/// `Double` because GCK serializes `customData` to JSON, where JS has a single number type;
/// pinning everything to double keeps iOS and Android round-trips identical. Nested
/// objects/arrays are intentionally not modelled by the fixture corpus.
extension AnyMap {
  /// Flattens this map into a plain `[String: Any]` suitable for a GCK `customData` slot.
  func toGckCustomData() -> [String: Any] {
    var dict: [String: Any] = [:]
    for key in getAllKeys() {
      if isString(key: key) {
        dict[key] = getString(key: key)
      } else if isBool(key: key) {
        dict[key] = getBoolean(key: key)
      } else if isInt64(key: key) {
        dict[key] = Double(getInt64(key: key))
      } else if isDouble(key: key) {
        dict[key] = getDouble(key: key)
      }
    }
    return dict
  }

  /// Rebuilds an `AnyMap` from a GCK `customData` value, or `nil` if the value is absent /
  /// not a string-keyed object. Empty objects normalize to `nil` so a present-but-empty
  /// `customData` and an absent one round-trip identically.
  static func fromGckCustomData(_ value: Any?) -> AnyMap? {
    guard let dict = value as? [String: Any], !dict.isEmpty else {
      return nil
    }
    let map = AnyMap()
    for (key, raw) in dict {
      if let string = raw as? String {
        map.setString(key: key, value: string)
      } else if let number = raw as? NSNumber {
        // JSON booleans arrive as CFBoolean, which IS an NSNumber — check its CFTypeID
        // before the generic number branch, or `true`/`false` would collapse to 1.0/0.0
        // (Android's converter preserves Boolean, so this keeps the platforms symmetric).
        if CFGetTypeID(number) == CFBooleanGetTypeID() {
          map.setBoolean(key: key, value: number.boolValue)
        } else {
          map.setDouble(key: key, value: number.doubleValue)
        }
      }
    }
    return map.getAllKeys().isEmpty ? nil : map
  }
}

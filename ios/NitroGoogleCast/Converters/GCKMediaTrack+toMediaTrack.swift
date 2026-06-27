import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaTrack` into a generated `MediaTrack` struct.
///
/// Reverse of `MediaTrack+toGckMediaTrack.swift`. `contentType` is non-null in GCK; an empty
/// string normalizes to `nil` (it represents the absent case the forward converter encodes).
/// `textSubtype` `Unknown` maps to `nil` via the enum mapper.
extension GCKMediaTrack {
  func toMediaTrack() -> MediaTrack {
    return MediaTrack(
      id: Double(identifier),
      type: type.toMediaTrackType(),
      contentId: contentIdentifier,
      contentType: contentType.isEmpty ? nil : contentType,
      language: languageCode,
      name: name,
      subtype: textSubtype.toMediaTrackSubtype(),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

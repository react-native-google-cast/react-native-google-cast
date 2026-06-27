import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaTrack` struct into a `GCKMediaTrack`.
///
/// Reverse lives in `GCKMediaTrack+toMediaTrack.swift`. Notes:
/// - `GCKMediaTrack.contentType` is required (non-null) by GCK, so an absent `contentType`
///   is sent as `""`; the reverse converter maps `""` back to `nil` (cross-platform: Android
///   must reconcile the same empty-vs-absent rule).
/// - `subtype` is required by GCK; absent maps to `Unknown`, which the reverse maps to `nil`.
/// - `customData` is the opaque GCK `id` slot (see `AnyMap+GckCustomData.swift`).
/// - `id`/`type` map by value via the enum mappers.
extension MediaTrack {
  func toGckMediaTrack() -> GCKMediaTrack {
    // GCK's initializer is failable (returns nil only for a malformed track, e.g. negative
    // identifier); our typed struct cannot express those, so force-unwrap is safe here.
    return GCKMediaTrack(
      identifier: Int(id),
      contentIdentifier: contentId,
      contentType: contentType ?? "",
      type: type.toGckTrackType(),
      textSubtype: subtype?.toGckTextTrackSubtype() ?? .unknown,
      name: name,
      languageCode: language,
      customData: customData?.toGckCustomData()
    )!
  }
}

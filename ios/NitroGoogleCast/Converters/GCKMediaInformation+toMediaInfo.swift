import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaInformation` into a generated `MediaInfo` struct.
///
/// Reverse of `MediaInfo+toGckMediaInformation.swift`. Notes:
/// - `contentType` is non-null in GCK; an empty string normalizes to `nil`.
/// - `streamDuration` uses `GCKIsValidTimeInterval` to map GCK's unset/invalid sentinel back
///   to `nil`.
/// - `streamType` is always present in GCK; `None`/`Unknown` map to `other`.
/// - Empty `mediaTracks` normalizes to `nil`.
extension GCKMediaInformation {
  func toMediaInfo() -> MediaInfo {
    let tracks = (mediaTracks ?? []).map { $0.toMediaTrack() }

    return MediaInfo(
      contentUrl: contentURL?.absoluteString ?? "",
      contentId: contentID,
      contentType: contentType.isEmpty ? nil : contentType,
      entity: entity,
      streamType: streamType.toMediaStreamType(),
      metadata: metadata?.toMediaMetadata(),
      streamDuration: gckFiniteTimeInterval(streamDuration),
      mediaTracks: tracks.isEmpty ? nil : tracks,
      textTrackStyle: textTrackStyle?.toTextTrackStyle(),
      hlsSegmentFormat: hlsSegmentFormat.toMediaHlsSegmentFormat(),
      hlsVideoSegmentFormat: hlsVideoSegmentFormat.toMediaHlsVideoSegmentFormat(),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

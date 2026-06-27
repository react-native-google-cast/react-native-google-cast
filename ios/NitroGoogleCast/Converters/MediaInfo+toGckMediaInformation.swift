import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaInfo` struct into a `GCKMediaInformation` via
/// `GCKMediaInformationBuilder` (the non-deprecated construction path).
///
/// Reverse lives in `GCKMediaInformation+toMediaInfo.swift`. Notes:
/// - `contentUrl` seeds the builder; `contentId`/`entity` are independent optional fields.
/// - `streamType` is non-optional in GCK; when absent the builder default (`None`) is used,
///   which the reverse maps to `other` (so absent `streamType` normalizes to `other`).
/// - Nested structs use their own converters; enums map by value.
extension MediaInfo {
  func toGckMediaInformation() -> GCKMediaInformation {
    let url = URL(string: contentUrl) ?? URL(string: "about:blank")!
    let builder = GCKMediaInformationBuilder(contentURL: url)

    if let contentId { builder.contentID = contentId }
    if let contentType { builder.contentType = contentType }
    if let entity { builder.entity = entity }
    if let streamType { builder.streamType = streamType.toGckStreamType() }
    if let metadata { builder.metadata = metadata.toGckMediaMetadata() }
    if let streamDuration { builder.streamDuration = streamDuration }
    if let mediaTracks { builder.mediaTracks = mediaTracks.map { $0.toGckMediaTrack() } }
    if let textTrackStyle { builder.textTrackStyle = textTrackStyle.toGckTextTrackStyle() }
    if let hlsSegmentFormat {
      builder.hlsSegmentFormat = hlsSegmentFormat.toGckHlsSegmentFormat()
    }
    if let hlsVideoSegmentFormat {
      builder.hlsVideoSegmentFormat = hlsVideoSegmentFormat.toGckHlsVideoSegmentFormat()
    }
    if let customData { builder.customData = customData.toGckCustomData() }

    return builder.build()
  }
}

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

    // contentId falls back to contentUrl — the documented default on
    // `MediaInfo.contentId`, and what v4 did. The Default Media Receiver keys
    // off contentID; without it `loadMedia` is accepted and then fails on the
    // receiver with `idleReason: error`, which reads as a codec problem.
    builder.contentID = contentId ?? contentUrl
    if let contentType { builder.contentType = contentType }
    if let entity { builder.entity = entity }
    // Defaults to buffered — see the note in the Android converter; keeps the
    // three platforms behaviourally identical for the same MediaLoadRequest.
    builder.streamType = (streamType ?? .buffered).toGckStreamType()
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

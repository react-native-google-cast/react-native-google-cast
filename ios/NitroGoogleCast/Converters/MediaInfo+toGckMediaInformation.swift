import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaInfo` struct into a `GCKMediaInformation` via
/// `GCKMediaInformationBuilder` (the non-deprecated construction path).
///
/// Reverse lives in `GCKMediaInformation+toMediaInfo.swift`. Notes:
/// - `contentUrl` seeds the builder; `entity` is an independent optional field. `contentId`
///   is not independent — an omitted one defaults to `contentUrl` (see below).
/// - `streamType` is non-optional in GCK. An omitted one defaults to `buffered` rather than
///   the builder's `None`, so the same `MediaLoadRequest` behaves identically on all three
///   platforms. Both defaults are pinned by `fixtures/converters/mediaInfo.json`.
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
    // An omitted streamDuration must stay omitted, not become 0.
    // `GCKMediaInformationBuilder` defaults it to 0, and GCK then puts
    // `"duration":0` on the wire — where Android sends `"duration":null`.
    // For a BUFFERED stream the receiver measures the real duration, so `null`
    // means "unknown" and `0` claims "zero-length": a receiver that trusts the
    // field would be misled. Observed as an actual wire difference on
    // 2026-08-06 via the device-pass media oracle (bead v5-3mg).
    builder.streamDuration = streamDuration ?? kGCKInvalidTimeInterval
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

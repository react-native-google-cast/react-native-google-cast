import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaLoadRequest` struct into a `GCKMediaLoadRequestData` via
/// `GCKMediaLoadRequestDataBuilder`.
///
/// Reverse lives in `GCKMediaLoadRequestData+toMediaLoadRequest.swift`. Notes:
/// - `autoplay` is an `NSNumber?` in GCK, so it round-trips as a true optional.
/// - `startTime` left unset uses GCK's sentinel (→ `nil` on reverse).
/// - `playbackRate` is a non-optional `float` in GCK; when absent the builder default applies
///   and the reverse always emits a value (the corpus pins the observed default).
extension MediaLoadRequest {
  func toGckMediaLoadRequestData() -> GCKMediaLoadRequestData {
    let builder = GCKMediaLoadRequestDataBuilder()
    if let mediaInfo { builder.mediaInformation = mediaInfo.toGckMediaInformation() }
    if let queueData { builder.queueData = queueData.toGckMediaQueueData() }
    if let autoplay { builder.autoplay = NSNumber(value: autoplay) }
    if let startTime { builder.startTime = startTime }
    if let playbackRate { builder.playbackRate = Float(playbackRate) }
    if let credentials { builder.credentials = credentials }
    if let credentialsType { builder.credentialsType = credentialsType }
    if let customData { builder.customData = customData.toGckCustomData() }
    return builder.build()
  }
}

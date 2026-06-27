import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaQueueItem` struct into a `GCKMediaQueueItem` via
/// `GCKMediaQueueItemBuilder`.
///
/// Reverse lives in `GCKMediaQueueItem+toMediaQueueItem.swift`. Notes:
/// - `itemId` is assigned by the receiver and has NO builder setter, so it is dropped on the
///   forward trip and always comes back `nil` (cross-platform: Android must reconcile).
/// - `autoplay` is non-optional in GCK; when absent, GCK's builder default applies and the
///   reverse always emits a value (the corpus pins the observed default).
/// - Time intervals left unset use GCK's sentinel, which the reverse maps back to `nil`.
extension MediaQueueItem {
  func toGckMediaQueueItem() -> GCKMediaQueueItem {
    let builder = GCKMediaQueueItemBuilder()
    builder.mediaInformation = mediaInfo.toGckMediaInformation()
    if let autoplay { builder.autoplay = autoplay }
    if let startTime { builder.startTime = startTime }
    if let playbackDuration { builder.playbackDuration = playbackDuration }
    if let preloadTime { builder.preloadTime = preloadTime }
    if let activeTrackIds {
      builder.activeTrackIDs = activeTrackIds.map { NSNumber(value: $0) }
    }
    if let customData { builder.customData = customData.toGckCustomData() }
    return builder.build()
  }
}

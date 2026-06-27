import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaQueueItem` into a generated `MediaQueueItem` struct.
///
/// Reverse of `MediaQueueItem+toGckMediaQueueItem.swift`. `itemID` of
/// `kGCKMediaQueueInvalidItemID` maps to `nil`. Time intervals are guarded with
/// `GCKIsValidTimeInterval` so unset values come back `nil`. `autoplay` is non-optional in GCK
/// and always emitted. Empty `activeTrackIDs` normalizes to `nil`.
extension GCKMediaQueueItem {
  func toMediaQueueItem() -> MediaQueueItem {
    let trackIds = (activeTrackIDs ?? []).map { $0.doubleValue }

    return MediaQueueItem(
      mediaInfo: mediaInformation.toMediaInfo(),
      itemId: itemID == kGCKMediaQueueInvalidItemID ? nil : Double(itemID),
      activeTrackIds: trackIds.isEmpty ? nil : trackIds,
      autoplay: autoplay,
      playbackDuration: gckFiniteTimeInterval(playbackDuration),
      preloadTime: gckFiniteTimeInterval(preloadTime),
      startTime: gckFiniteTimeInterval(startTime),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

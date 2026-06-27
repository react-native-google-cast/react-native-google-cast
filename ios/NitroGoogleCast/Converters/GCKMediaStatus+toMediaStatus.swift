import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaStatus` into a generated `MediaStatus` struct.
///
/// `GCKMediaStatus` is effectively receive-only (only `initWithSessionID:mediaInformation:` is
/// public); this GCK→struct direction is the one used in the real app. Queue items are read
/// through `queueItemCount`/`queueItemAtIndex:`. The item-id fields map
/// `kGCKMediaQueueInvalidItemID` to `nil`. `playerState`/`idleReason`/`queueRepeatMode` map
/// their sentinel values (`Unknown`/`None`/`Unchanged`) to `nil`. Empty `activeTrackIDs`
/// normalizes to `nil`.
extension GCKMediaStatus {
  func toMediaStatus() -> MediaStatus {
    let items = (0..<queueItemCount).compactMap { queueItem(at: $0)?.toMediaQueueItem() }
    let tracks = (activeTrackIDs ?? []).map { $0.doubleValue }

    return MediaStatus(
      mediaInfo: mediaInformation?.toMediaInfo(),
      playerState: playerState.toMediaPlayerState(),
      idleReason: idleReason.toMediaPlayerIdleReason(),
      streamPosition: streamPosition,
      playbackRate: Double(playbackRate),
      volume: Double(volume),
      isMuted: isMuted,
      activeTrackIds: tracks.isEmpty ? nil : tracks,
      videoInfo: videoInfo?.toVideoInfo(),
      liveSeekableRange: liveSeekableRange?.toMediaLiveSeekableRange(),
      queueItems: items,
      currentItemId: currentItemID == kGCKMediaQueueInvalidItemID ? nil : Double(currentItemID),
      loadingItemId: loadingItemID == kGCKMediaQueueInvalidItemID ? nil : Double(loadingItemID),
      preloadedItemId: preloadedItemID == kGCKMediaQueueInvalidItemID
        ? nil : Double(preloadedItemID),
      queueRepeatMode: queueRepeatMode.toMediaRepeatMode(),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

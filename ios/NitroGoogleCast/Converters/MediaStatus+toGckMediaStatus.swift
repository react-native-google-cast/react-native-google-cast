import Foundation
import GoogleCast
import NitroModules

/// Debug-seam constructor: builds a `GCKMediaStatus` from a generated `MediaStatus` struct.
///
/// `GCKMediaStatus` is effectively receive-only (only `initWithSessionID:mediaInformation:` is
/// public; everything else is read-only), so the real app never sends it. This direction
/// exists only so the cross-platform round-trip parity suite can exercise the reverse converter
/// (`GCKMediaStatus+toMediaStatus.swift`). Read-only properties are populated via KVC against
/// the backing ivars.
extension MediaStatus {
  func toGckMediaStatus() -> GCKMediaStatus {
    let status = GCKMediaStatus(
      sessionID: 0, mediaInformation: mediaInfo?.toGckMediaInformation())

    if let playerState {
      status.setValue(playerState.toGckPlayerState().rawValue, forKey: "playerState")
    }
    if let idleReason {
      status.setValue(idleReason.toGckIdleReason().rawValue, forKey: "idleReason")
    }
    status.setValue(streamPosition, forKey: "streamPosition")
    status.setValue(Float(playbackRate), forKey: "playbackRate")
    status.setValue(Float(volume), forKey: "volume")
    status.setValue(isMuted, forKey: "isMuted")
    if let activeTrackIds {
      status.setValue(activeTrackIds.map { NSNumber(value: $0) }, forKey: "activeTrackIDs")
    }
    if let videoInfo {
      status.setValue(videoInfo.toGckVideoInfo(), forKey: "videoInfo")
    }
    if let liveSeekableRange {
      status.setValue(liveSeekableRange.toGckMediaLiveSeekableRange(), forKey: "liveSeekableRange")
    }
    if !queueItems.isEmpty {
      status.setValue(queueItems.map { $0.toGckMediaQueueItem() }, forKey: "queueItems")
    }
    if let currentItemId {
      status.setValue(NSNumber(value: UInt(currentItemId)), forKey: "currentItemID")
    }
    if let queueRepeatMode {
      status.setValue(queueRepeatMode.toGckRepeatMode().rawValue, forKey: "queueRepeatMode")
    }
    if let customData {
      status.setValue(customData.toGckCustomData(), forKey: "customData")
    }

    return status
  }
}

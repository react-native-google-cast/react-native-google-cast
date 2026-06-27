import Foundation
import GoogleCast

/// Converts a `GCKMediaLiveSeekableRange` into a generated `MediaLiveSeekableRange` struct.
///
/// `GCKMediaLiveSeekableRange` is a receive-only GCK type (no public initializer); this
/// GCK→struct direction is the one used in the real app. All fields are non-optional.
extension GCKMediaLiveSeekableRange {
  func toMediaLiveSeekableRange() -> MediaLiveSeekableRange {
    return MediaLiveSeekableRange(
      startTime: startTime,
      endTime: endTime,
      isMovingWindow: isMovingWindow,
      isLiveDone: isLiveDone
    )
  }
}

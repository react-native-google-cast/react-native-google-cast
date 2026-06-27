import Foundation
import GoogleCast

/// Value-based mapping between our `MediaTrackType` union and `GCKMediaTrackType`.
///
/// GCK values: `Unknown=0, Text=1, Audio=2, Video=3`. Our union (`audio`, `text`, `video`) is
/// the required `MediaTrack.type`, so the reverse direction always returns a concrete value;
/// the unreachable GCK `Unknown` falls back to `audio`. Mapped by value — never by ordinal.
extension MediaTrackType {
  func toGckTrackType() -> GCKMediaTrackType {
    switch self {
    case .audio: return .audio
    case .text: return .text
    case .video: return .video
    }
  }
}

extension GCKMediaTrackType {
  func toMediaTrackType() -> MediaTrackType {
    switch self {
    case .text: return .text
    case .video: return .video
    default: return .audio  // Audio and Unknown
    }
  }
}

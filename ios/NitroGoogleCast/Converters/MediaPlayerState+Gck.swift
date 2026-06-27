import Foundation
import GoogleCast

/// Value-based mapping between our `MediaPlayerState` union and `GCKMediaPlayerState`.
///
/// GCK values: `Unknown=0, Idle=1, Playing=2, Paused=3, Buffering=4, Loading=5`. Optional
/// field, so GCK `Unknown` maps to `nil`. Mapped by value.
extension MediaPlayerState {
  func toGckPlayerState() -> GCKMediaPlayerState {
    switch self {
    case .idle: return .idle
    case .playing: return .playing
    case .paused: return .paused
    case .buffering: return .buffering
    case .loading: return .loading
    }
  }
}

extension GCKMediaPlayerState {
  func toMediaPlayerState() -> MediaPlayerState? {
    switch self {
    case .idle: return .idle
    case .playing: return .playing
    case .paused: return .paused
    case .buffering: return .buffering
    case .loading: return .loading
    default: return nil  // Unknown
    }
  }
}

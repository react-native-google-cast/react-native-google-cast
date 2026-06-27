import Foundation
import GoogleCast

/// Value-based mapping between our `MediaSeekResumeState` union and `GCKMediaResumeState`.
///
/// GCK values: `Unchanged=0, Play=1, Pause=2`. Our union only models `play`/`pause`; an absent
/// resume state maps to GCK `Unchanged`, and GCK `Unchanged` maps back to `nil`. Mapped by
/// value.
extension MediaSeekResumeState {
  func toGckResumeState() -> GCKMediaResumeState {
    switch self {
    case .play: return .play
    case .pause: return .pause
    }
  }
}

extension GCKMediaResumeState {
  func toMediaSeekResumeState() -> MediaSeekResumeState? {
    switch self {
    case .play: return .play
    case .pause: return .pause
    default: return nil  // Unchanged
    }
  }
}

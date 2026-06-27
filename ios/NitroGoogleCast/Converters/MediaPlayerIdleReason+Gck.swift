import Foundation
import GoogleCast

/// Value-based mapping between our `MediaPlayerIdleReason` union and `GCKMediaPlayerIdleReason`.
///
/// GCK values: `None=0, Finished=1, Cancelled=2, Interrupted=3, Error=4`. Our union models
/// `finished`/`cancelled`/`interrupted`/`error`; an absent reason maps to GCK `None`, and GCK
/// `None` maps back to `nil`. Mapped by value.
extension MediaPlayerIdleReason {
  func toGckIdleReason() -> GCKMediaPlayerIdleReason {
    switch self {
    case .finished: return .finished
    case .cancelled: return .cancelled
    case .interrupted: return .interrupted
    case .error: return .error
    }
  }
}

extension GCKMediaPlayerIdleReason {
  func toMediaPlayerIdleReason() -> MediaPlayerIdleReason? {
    switch self {
    case .finished: return .finished
    case .cancelled: return .cancelled
    case .interrupted: return .interrupted
    case .error: return .error
    default: return nil  // None
    }
  }
}

import Foundation
import GoogleCast

/// Value-based mapping between our `MediaRepeatMode` union and `GCKMediaRepeatMode`.
///
/// GCK values: `Unchanged=0, Off=1, Single=2, All=3, AllAndShuffle=4`. Our union models
/// `off`/`single`/`all`/`allAndShuffle`; an absent repeat mode maps to GCK `Unchanged`, and
/// GCK `Unchanged` maps back to `nil`. Mapped by value.
extension MediaRepeatMode {
  func toGckRepeatMode() -> GCKMediaRepeatMode {
    switch self {
    case .off: return .off
    case .single: return .single
    case .all: return .all
    case .allandshuffle: return .allAndShuffle
    }
  }
}

extension GCKMediaRepeatMode {
  func toMediaRepeatMode() -> MediaRepeatMode? {
    switch self {
    case .off: return .off
    case .single: return .single
    case .all: return .all
    case .allAndShuffle: return .allandshuffle
    default: return nil  // Unchanged
    }
  }
}

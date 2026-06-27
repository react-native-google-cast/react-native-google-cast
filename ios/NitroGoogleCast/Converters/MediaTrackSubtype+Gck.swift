import Foundation
import GoogleCast

/// Value-based mapping between our `MediaTrackSubtype` union and `GCKMediaTextTrackSubtype`.
///
/// GCK values: `Unknown=0, Subtitles=1, Captions=3, Descriptions=4, Chapters=5, Metadata=6`.
/// The field is optional, so absent / GCK `Unknown` maps to `nil`. Mapped by value.
extension MediaTrackSubtype {
  func toGckTextTrackSubtype() -> GCKMediaTextTrackSubtype {
    switch self {
    case .subtitles: return .subtitles
    case .captions: return .captions
    case .descriptions: return .descriptions
    case .chapters: return .chapters
    case .metadata: return .metadata
    }
  }
}

extension GCKMediaTextTrackSubtype {
  func toMediaTrackSubtype() -> MediaTrackSubtype? {
    switch self {
    case .subtitles: return .subtitles
    case .captions: return .captions
    case .descriptions: return .descriptions
    case .chapters: return .chapters
    case .metadata: return .metadata
    default: return nil  // Unknown
    }
  }
}

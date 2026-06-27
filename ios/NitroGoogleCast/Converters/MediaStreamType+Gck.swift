import Foundation
import GoogleCast

/// Value-based mapping between our `MediaStreamType` union and `GCKMediaStreamType`.
///
/// GCK values: `None=0, Buffered=1, Live=2, Unknown=99`. Our union has `buffered`, `live`,
/// `other`; `other` maps to GCK `None` (the "no specific stream" type). On the way back, both
/// GCK `None` and `Unknown` collapse to `other`. Mapped by value — never by ordinal.
extension MediaStreamType {
  func toGckStreamType() -> GCKMediaStreamType {
    switch self {
    case .buffered: return .buffered
    case .live: return .live
    case .other: return GCKMediaStreamType.none
    }
  }
}

extension GCKMediaStreamType {
  func toMediaStreamType() -> MediaStreamType {
    switch self {
    case .buffered: return .buffered
    case .live: return .live
    default: return .other  // None and Unknown
    }
  }
}

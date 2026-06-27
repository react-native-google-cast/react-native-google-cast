import Foundation
import GoogleCast

/// Value-based mapping between our `TextTrackWindowType` union and
/// `GCKMediaTextTrackStyleWindowType`.
///
/// GCK values: `Unknown=-1, None=0, Normal=1, RoundedCorners=2`. Our `rounded` maps to GCK
/// `RoundedCorners`. Optional field, so GCK `Unknown` maps to `nil`. Mapped by value.
extension TextTrackWindowType {
  func toGckWindowType() -> GCKMediaTextTrackStyleWindowType {
    switch self {
    case .none: return GCKMediaTextTrackStyleWindowType.none
    case .normal: return .normal
    case .rounded: return .roundedCorners
    }
  }
}

extension GCKMediaTextTrackStyleWindowType {
  func toTextTrackWindowType() -> TextTrackWindowType? {
    switch self {
    case GCKMediaTextTrackStyleWindowType.none: return TextTrackWindowType.none
    case .normal: return .normal
    case .roundedCorners: return .rounded
    default: return nil  // Unknown
    }
  }
}

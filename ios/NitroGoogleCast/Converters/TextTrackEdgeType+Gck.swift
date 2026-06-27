import Foundation
import GoogleCast

/// Value-based mapping between our `TextTrackEdgeType` union and
/// `GCKMediaTextTrackStyleEdgeType`.
///
/// GCK values: `Unknown=-1, None=0, Outline=1, DropShadow=2, Raised=3, Depressed=4`.
/// Optional field, so GCK `Unknown` maps to `nil`. Mapped by value.
extension TextTrackEdgeType {
  func toGckEdgeType() -> GCKMediaTextTrackStyleEdgeType {
    switch self {
    case .none: return GCKMediaTextTrackStyleEdgeType.none
    case .outline: return .outline
    case .dropshadow: return .dropShadow
    case .raised: return .raised
    case .depressed: return .depressed
    }
  }
}

extension GCKMediaTextTrackStyleEdgeType {
  func toTextTrackEdgeType() -> TextTrackEdgeType? {
    switch self {
    case GCKMediaTextTrackStyleEdgeType.none: return TextTrackEdgeType.none
    case .outline: return .outline
    case .dropShadow: return .dropshadow
    case .raised: return .raised
    case .depressed: return .depressed
    default: return nil  // Unknown
    }
  }
}

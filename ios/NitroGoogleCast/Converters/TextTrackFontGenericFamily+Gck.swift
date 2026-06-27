import Foundation
import GoogleCast

/// Value-based mapping between our `TextTrackFontGenericFamily` union and
/// `GCKMediaTextTrackStyleFontGenericFamily`.
///
/// GCK values: `Unknown=-1, None=0, SansSerif=1, MonospacedSansSerif=2, Serif=3,
/// MonospacedSerif=4, Casual=5, Cursive=6, SmallCapitals=7`. Optional field, so GCK
/// `Unknown`/`None` map to `nil`. Mapped by value.
extension TextTrackFontGenericFamily {
  func toGckFontGenericFamily() -> GCKMediaTextTrackStyleFontGenericFamily {
    switch self {
    case .sansserif: return .sansSerif
    case .monosansserif: return .monospacedSansSerif
    case .serif: return .serif
    case .monoserif: return .monospacedSerif
    case .casual: return .casual
    case .cursive: return .cursive
    case .smallcaps: return .smallCapitals
    }
  }
}

extension GCKMediaTextTrackStyleFontGenericFamily {
  func toTextTrackFontGenericFamily() -> TextTrackFontGenericFamily? {
    switch self {
    case .sansSerif: return .sansserif
    case .monospacedSansSerif: return .monosansserif
    case .serif: return .serif
    case .monospacedSerif: return .monoserif
    case .casual: return .casual
    case .cursive: return .cursive
    case .smallCapitals: return .smallcaps
    default: return nil  // None and Unknown
    }
  }
}

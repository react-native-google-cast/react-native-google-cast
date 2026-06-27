import Foundation
import GoogleCast

/// Value-based mapping between our `TextTrackFontStyle` union and
/// `GCKMediaTextTrackStyleFontStyle`.
///
/// GCK values: `Unknown=-1, Normal=0, Bold=1, Italic=2, BoldItalic=3`. Optional field, so GCK
/// `Unknown` maps to `nil`. Mapped by value.
extension TextTrackFontStyle {
  func toGckFontStyle() -> GCKMediaTextTrackStyleFontStyle {
    switch self {
    case .normal: return .normal
    case .bold: return .bold
    case .italic: return .italic
    case .bolditalic: return .boldItalic
    }
  }
}

extension GCKMediaTextTrackStyleFontStyle {
  func toTextTrackFontStyle() -> TextTrackFontStyle? {
    switch self {
    case .normal: return .normal
    case .bold: return .bold
    case .italic: return .italic
    case .boldItalic: return .bolditalic
    default: return nil  // Unknown
    }
  }
}

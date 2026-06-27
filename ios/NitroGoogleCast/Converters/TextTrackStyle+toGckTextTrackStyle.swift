import CoreGraphics
import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `TextTrackStyle` struct into a `GCKMediaTextTrackStyle`.
///
/// Reverse lives in `GCKMediaTextTrackStyle+toTextTrackStyle.swift`. Notes:
/// - Colors are CSS strings on our side and `GCKColor` on GCK's; we bridge via
///   `GCKColor(cssString:)` / `cssString()`. GCK normalizes the CSS form (e.g. expands to
///   `#RRGGBBAA`), so the corpus pins the normalized output — Android must reconcile.
/// - `fontScale` and `windowRoundedCornerRadius` are non-optional `CGFloat` in GCK; when absent
///   we leave GCK's `init()` defaults, so the reverse always emits a number (the corpus pins
///   the observed defaults).
/// - Enum fields map by value; absent enum fields leave GCK's defaults.
extension TextTrackStyle {
  func toGckTextTrackStyle() -> GCKMediaTextTrackStyle {
    let style = GCKMediaTextTrackStyle()
    if let backgroundColor { style.backgroundColor = GCKColor(cssString: backgroundColor) }
    if let edgeColor { style.edgeColor = GCKColor(cssString: edgeColor) }
    if let edgeType { style.edgeType = edgeType.toGckEdgeType() }
    if let fontFamily { style.fontFamily = fontFamily }
    if let fontGenericFamily {
      style.fontGenericFamily = fontGenericFamily.toGckFontGenericFamily()
    }
    if let fontScale { style.fontScale = CGFloat(fontScale) }
    if let fontStyle { style.fontStyle = fontStyle.toGckFontStyle() }
    if let foregroundColor { style.foregroundColor = GCKColor(cssString: foregroundColor) }
    if let windowColor { style.windowColor = GCKColor(cssString: windowColor) }
    if let windowCornerRadius { style.windowRoundedCornerRadius = CGFloat(windowCornerRadius) }
    if let windowType { style.windowType = windowType.toGckWindowType() }
    if let customData { style.customData = customData.toGckCustomData() }
    return style
  }
}

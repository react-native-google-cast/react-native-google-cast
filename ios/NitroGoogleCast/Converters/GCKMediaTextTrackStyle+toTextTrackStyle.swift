import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaTextTrackStyle` into a generated `TextTrackStyle` struct.
///
/// Reverse of `TextTrackStyle+toGckTextTrackStyle.swift`. Colors are emitted as GCK's
/// normalized CSS strings. `fontScale` and `windowCornerRadius` are non-optional in GCK, so
/// they are always emitted (the corpus pins GCK's `init()` defaults for the absent case).
extension GCKMediaTextTrackStyle {
  func toTextTrackStyle() -> TextTrackStyle {
    return TextTrackStyle(
      backgroundColor: backgroundColor?.cssString(),
      edgeColor: edgeColor?.cssString(),
      edgeType: edgeType.toTextTrackEdgeType(),
      fontFamily: fontFamily,
      fontGenericFamily: fontGenericFamily.toTextTrackFontGenericFamily(),
      fontScale: Double(fontScale),
      fontStyle: fontStyle.toTextTrackFontStyle(),
      foregroundColor: foregroundColor?.cssString(),
      windowColor: windowColor?.cssString(),
      windowCornerRadius: Double(windowRoundedCornerRadius),
      windowType: windowType.toTextTrackWindowType(),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.TextTrackEdgeType
import com.margelo.nitro.googlecast.TextTrackFontGenericFamily
import com.margelo.nitro.googlecast.TextTrackFontStyle
import com.margelo.nitro.googlecast.TextTrackStyle
import com.margelo.nitro.googlecast.TextTrackWindowType
import com.google.android.gms.cast.TextTrackStyle as GckTextTrackStyle

/**
 * Converts a Google Cast [GckTextTrackStyle] into a generated [TextTrackStyle] struct.
 *
 * Reverse of `TextTrackStyle+toGckTextTrackStyle.kt`. Enum fields are mapped BY VALUE, with
 * the `*_UNSPECIFIED` sentinels mapping to `null`. Colors equal to `COLOR_UNSPECIFIED` become
 * `null`, otherwise they are emitted as `#AARRGGBB` hex. `fontScale` and `windowCornerRadius`
 * are GCK primitives with no "absent" representation, so they are always emitted as present
 * numbers (a struct with those fields `null` will round-trip to their GCK defaults — a parity
 * reconciliation point).
 */
internal fun GckTextTrackStyle.toTextTrackStyle(): TextTrackStyle =
  TextTrackStyle(
    backgroundColor = colorOrNull(backgroundColor),
    edgeColor = colorOrNull(edgeColor),
    edgeType = edgeTypeOrNull(edgeType),
    fontFamily = fontFamily,
    fontGenericFamily = fontGenericFamilyOrNull(fontGenericFamily),
    fontScale = fontScale.toDouble(),
    fontStyle = fontStyleOrNull(fontStyle),
    foregroundColor = colorOrNull(foregroundColor),
    windowColor = colorOrNull(windowColor),
    windowCornerRadius = windowCornerRadius.toDouble(),
    windowType = windowTypeOrNull(windowType),
    customData = customData?.toAnyMap()
  )

private fun colorOrNull(color: Int): String? =
  if (color == GckTextTrackStyle.COLOR_UNSPECIFIED) null else String.format("#%08X", color)

private fun edgeTypeOrNull(value: Int): TextTrackEdgeType? =
  when (value) {
    GckTextTrackStyle.EDGE_TYPE_DEPRESSED -> TextTrackEdgeType.DEPRESSED
    GckTextTrackStyle.EDGE_TYPE_DROP_SHADOW -> TextTrackEdgeType.DROPSHADOW
    GckTextTrackStyle.EDGE_TYPE_NONE -> TextTrackEdgeType.NONE
    GckTextTrackStyle.EDGE_TYPE_OUTLINE -> TextTrackEdgeType.OUTLINE
    GckTextTrackStyle.EDGE_TYPE_RAISED -> TextTrackEdgeType.RAISED
    else -> null
  }

private fun fontGenericFamilyOrNull(value: Int): TextTrackFontGenericFamily? =
  when (value) {
    GckTextTrackStyle.FONT_FAMILY_CASUAL -> TextTrackFontGenericFamily.CASUAL
    GckTextTrackStyle.FONT_FAMILY_CURSIVE -> TextTrackFontGenericFamily.CURSIVE
    GckTextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF -> TextTrackFontGenericFamily.MONOSANSSERIF
    GckTextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF -> TextTrackFontGenericFamily.MONOSERIF
    GckTextTrackStyle.FONT_FAMILY_SANS_SERIF -> TextTrackFontGenericFamily.SANSSERIF
    GckTextTrackStyle.FONT_FAMILY_SERIF -> TextTrackFontGenericFamily.SERIF
    GckTextTrackStyle.FONT_FAMILY_SMALL_CAPITALS -> TextTrackFontGenericFamily.SMALLCAPS
    else -> null
  }

private fun fontStyleOrNull(value: Int): TextTrackFontStyle? =
  when (value) {
    GckTextTrackStyle.FONT_STYLE_BOLD -> TextTrackFontStyle.BOLD
    GckTextTrackStyle.FONT_STYLE_BOLD_ITALIC -> TextTrackFontStyle.BOLDITALIC
    GckTextTrackStyle.FONT_STYLE_ITALIC -> TextTrackFontStyle.ITALIC
    GckTextTrackStyle.FONT_STYLE_NORMAL -> TextTrackFontStyle.NORMAL
    else -> null
  }

private fun windowTypeOrNull(value: Int): TextTrackWindowType? =
  when (value) {
    GckTextTrackStyle.WINDOW_TYPE_NONE -> TextTrackWindowType.NONE
    GckTextTrackStyle.WINDOW_TYPE_NORMAL -> TextTrackWindowType.NORMAL
    GckTextTrackStyle.WINDOW_TYPE_ROUNDED -> TextTrackWindowType.ROUNDED
    else -> null
  }

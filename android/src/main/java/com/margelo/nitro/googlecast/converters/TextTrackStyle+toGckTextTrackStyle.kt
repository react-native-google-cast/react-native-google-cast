package com.margelo.nitro.googlecast.converters

import android.graphics.Color
import com.margelo.nitro.googlecast.TextTrackEdgeType
import com.margelo.nitro.googlecast.TextTrackFontGenericFamily
import com.margelo.nitro.googlecast.TextTrackFontStyle
import com.margelo.nitro.googlecast.TextTrackStyle
import com.margelo.nitro.googlecast.TextTrackWindowType
import com.google.android.gms.cast.TextTrackStyle as GckTextTrackStyle

/**
 * Converts a generated [TextTrackStyle] struct into a Google Cast [GckTextTrackStyle].
 *
 * The reverse lives in `GckTextTrackStyle+toTextTrackStyle.kt`. Enum fields are mapped BY
 * VALUE. Colors are `#AARRGGBB` hex strings in the struct and packed `int` ARGB in GCK
 * (`COLOR_UNSPECIFIED` sentinel for absent). `fontScale` is a `Double` here / `Float` in GCK;
 * `windowCornerRadius` is a `Double` here / `Int` in GCK.
 */
internal fun TextTrackStyle.toGckTextTrackStyle(): GckTextTrackStyle {
  val gck = GckTextTrackStyle()
  backgroundColor?.let { gck.backgroundColor = Color.parseColor(it) }
  edgeColor?.let { gck.edgeColor = Color.parseColor(it) }
  foregroundColor?.let { gck.foregroundColor = Color.parseColor(it) }
  windowColor?.let { gck.windowColor = Color.parseColor(it) }
  edgeType?.let { gck.edgeType = it.toGckEdgeType() }
  fontFamily?.let { gck.setFontFamily(it) }
  fontGenericFamily?.let { gck.fontGenericFamily = it.toGckFontGenericFamily() }
  fontScale?.let { gck.fontScale = it.toFloat() }
  fontStyle?.let { gck.fontStyle = it.toGckFontStyle() }
  windowCornerRadius?.let { gck.windowCornerRadius = it.toInt() }
  windowType?.let { gck.windowType = it.toGckWindowType() }
  customData?.let { gck.setCustomData(it.toJsonObject()) }
  return gck
}

private fun TextTrackEdgeType.toGckEdgeType(): Int =
  when (this) {
    TextTrackEdgeType.DEPRESSED -> GckTextTrackStyle.EDGE_TYPE_DEPRESSED
    TextTrackEdgeType.DROPSHADOW -> GckTextTrackStyle.EDGE_TYPE_DROP_SHADOW
    TextTrackEdgeType.NONE -> GckTextTrackStyle.EDGE_TYPE_NONE
    TextTrackEdgeType.OUTLINE -> GckTextTrackStyle.EDGE_TYPE_OUTLINE
    TextTrackEdgeType.RAISED -> GckTextTrackStyle.EDGE_TYPE_RAISED
  }

private fun TextTrackFontGenericFamily.toGckFontGenericFamily(): Int =
  when (this) {
    TextTrackFontGenericFamily.CASUAL -> GckTextTrackStyle.FONT_FAMILY_CASUAL
    TextTrackFontGenericFamily.CURSIVE -> GckTextTrackStyle.FONT_FAMILY_CURSIVE
    TextTrackFontGenericFamily.MONOSANSSERIF -> GckTextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF
    TextTrackFontGenericFamily.MONOSERIF -> GckTextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF
    TextTrackFontGenericFamily.SANSSERIF -> GckTextTrackStyle.FONT_FAMILY_SANS_SERIF
    TextTrackFontGenericFamily.SERIF -> GckTextTrackStyle.FONT_FAMILY_SERIF
    TextTrackFontGenericFamily.SMALLCAPS -> GckTextTrackStyle.FONT_FAMILY_SMALL_CAPITALS
  }

private fun TextTrackFontStyle.toGckFontStyle(): Int =
  when (this) {
    TextTrackFontStyle.BOLD -> GckTextTrackStyle.FONT_STYLE_BOLD
    TextTrackFontStyle.BOLDITALIC -> GckTextTrackStyle.FONT_STYLE_BOLD_ITALIC
    TextTrackFontStyle.ITALIC -> GckTextTrackStyle.FONT_STYLE_ITALIC
    TextTrackFontStyle.NORMAL -> GckTextTrackStyle.FONT_STYLE_NORMAL
  }

private fun TextTrackWindowType.toGckWindowType(): Int =
  when (this) {
    TextTrackWindowType.NONE -> GckTextTrackStyle.WINDOW_TYPE_NONE
    TextTrackWindowType.NORMAL -> GckTextTrackStyle.WINDOW_TYPE_NORMAL
    TextTrackWindowType.ROUNDED -> GckTextTrackStyle.WINDOW_TYPE_ROUNDED
  }

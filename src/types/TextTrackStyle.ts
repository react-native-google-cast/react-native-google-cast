import type { AnyMap } from 'react-native-nitro-modules'

/**
 * The edge style of text in a {@linkcode TextTrackStyle}.
 *
 * @see {@linkcode TextTrackStyle.edgeType}
 */
export type TextTrackEdgeType =
  | 'depressed'
  | 'dropShadow'
  | 'none'
  | 'outline'
  | 'raised'

/**
 * Generic font family used when the requested {@linkcode TextTrackStyle.fontFamily} is unavailable.
 *
 * @see {@linkcode TextTrackStyle.fontGenericFamily}
 */
export type TextTrackFontGenericFamily =
  | 'casual'
  | 'cursive'
  | 'monoSansSerif'
  | 'monoSerif'
  | 'sansSerif'
  | 'serif'
  | 'smallCaps'

/**
 * The font style of text in a {@linkcode TextTrackStyle}.
 *
 * @see {@linkcode TextTrackStyle.fontStyle}
 */
export type TextTrackFontStyle = 'bold' | 'boldItalic' | 'italic' | 'normal'

/**
 * The window type behind text in a {@linkcode TextTrackStyle}.
 *
 * @see {@linkcode TextTrackStyle.windowType}
 */
export type TextTrackWindowType = 'none' | 'normal' | 'rounded'

/**
 * Style information for a text track.
 *
 * Specifies how a text track's text is displayed on-screen. The text is displayed inside
 * a rectangular "window"; the appearance of both the text and the window are configurable.
 *
 * With the exception of `fontScale` (which has a predefined default), any attribute that is
 * not explicitly set remains "unspecified" and the Cast Receiver selects an appropriate value.
 *
 * Colors are represented as `#RRGGBBAA` strings (CSS 8-digit hex notation).
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/TextTrackStyle) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_text_track_style) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.TextTrackStyle)
 */
export interface TextTrackStyle {
  /** Background RGBA color, represented as `#RRGGBBAA`. The alpha channel can be used for transparent backgrounds. */
  backgroundColor?: string

  /** RGBA color for the edge, represented as `#RRGGBBAA`. Ignored if `edgeType` is `none`. */
  edgeColor?: string

  /** The edge style of the text. */
  edgeType?: TextTrackEdgeType

  /** The requested font family. If unavailable on the receiver, `fontGenericFamily` is used instead. */
  fontFamily?: string

  /** Generic font family used as a fallback. */
  fontGenericFamily?: TextTrackFontGenericFamily

  /** The font scaling factor for the text track. Defaults to `1.0`. */
  fontScale?: number

  /** The font style of the text. */
  fontStyle?: TextTrackFontStyle

  /** Foreground RGBA color, represented as `#RRGGBBAA`. */
  foregroundColor?: string

  /** RGBA color for the window, represented as `#RRGGBBAA`. Ignored if `windowType` is `none`. */
  windowColor?: string

  /** Rounded-corner radius in pixels. Ignored unless `windowType` is `rounded`. */
  windowCornerRadius?: number

  /** The window type behind the text. */
  windowType?: TextTrackWindowType

  /** Custom application data. */
  customData?: AnyMap
}

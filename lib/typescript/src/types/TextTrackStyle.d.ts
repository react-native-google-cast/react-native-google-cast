/**
 * Describes style information for a text track.
 *
 * Specifies how a text track's text will be displayed on-screen. The text is displayed inside a rectangular "window". The appearance of both the text and the window are configurable.
 *
 * With the exception of `fontScale`, which has a predefined default value, any attribute that is not explicitly set will remain "unspecified", and the Cast Receiver will select an appropriate value.
 *
 * Colors are represented as strings “#RRGGBBAA” where XX are the two hexadecimal symbols that represent the 0-255 value for the specific channel/color. It follows CSS 8-digit hex color notation (See http://dev.w3.org/csswg/css-color/#hex-notation).
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/TextTrackStyle) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_text_track_style) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.TextTrackStyle)
 */
export default interface TextTrackStyle {
    /** Background RGBA color, represented as "#RRGGBBAA". The alpha channel should be used for transparent backgrounds. */
    backgroundColor?: string;
    /** Custom application data. */
    customData?: object;
    /** RGBA color for the edge, represented as "#RRGGBBAA". This value will be ignored if edgeType is `none`. */
    edgeColor?: string;
    edgeType?: 'depressed' | 'dropShadow' | 'none' | 'outline' | 'raised';
    /** If the font is not available in the receiver, the fontGenericFamily will be used instead. */
    fontFamily?: string;
    fontGenericFamily?: 'casual' | 'cursive' | 'monoSansSerif' | 'monoSerif' | 'sansSerif' | 'serif' | 'smallCaps';
    /** The font scaling factor for the text track (the default is 1.0). */
    fontScale?: number;
    fontStyle?: 'bold' | 'boldItalic' | 'italic' | 'normal';
    /** Foreground RGBA color, represented as "#RRGGBBAA". */
    foregroundColor?: string;
    /** RGBA color for the window, represented as "#RRGGBBAA". This value will be ignored if windowType is `none`. Some receiver devices may not support this attribute. */
    windowColor?: string;
    /** Rounded corner radius absolute value in pixels (px). This value will be ignored if windowType is not `rounded`. Some receiver devices may not support this attribute. */
    windowCornerRadius?: number;
    /** The window concept is defined in CEA-608 and CEA-708, See http://goo.gl/M3ea0X. In WebVTT is called a region. Some receiver devices may not support this attribute. */
    windowType?: 'none' | 'normal' | 'rounded';
}

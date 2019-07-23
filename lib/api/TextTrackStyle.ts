/**
 * Describes style information for a text track.
 *
 * A class that specifies how a text track's text will be displayed on-screen. The text is displayed inside a rectangular "window". The appearance of both the text and the window are configurable.
 *
 * With the exception of the font scale, which has a predefined default value, any attribute that is not explicitly set will remain "unspecified", and the Cast Receiver will select an appropriate value.
 *
 * Colors are represented as strings “#RRGGBBAA” where XX are the two hexadecimal symbols that represent the 0-255 value for the specific channel/color. It follows CSS 8-digit hex color notation (See http://dev.w3.org/csswg/css-color/#hex-notation).
 *
 * @export
 * @class TextTrackStyle
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/TextTrackStyle}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_text_track_style}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.TextTrackStyle}
 */
export default class TextTrackStyle {}

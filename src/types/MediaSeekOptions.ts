import type { AnyMap } from 'react-native-nitro-modules'

/**
 * The action to take after a seek operation finishes.
 *
 * @see {@linkcode MediaSeekOptions.resumeState}
 */
export type MediaSeekResumeState = 'play' | 'pause'

/**
 * Options for `RemoteMediaClient.seek`.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaSeekOptions) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_seek_options)
 */
export interface MediaSeekOptions {
  /** The position to seek to, in seconds from the beginning of the stream. Ignored if `infinite` is `true`. */
  position?: number

  /**
   * Whether the time interval is relative to the current stream position (`true`) or to the
   * beginning of the stream (`false`). Defaults to `false` (an absolute seek position).
   */
  relative?: boolean

  /** Whether to seek to the end of the stream or live edge. */
  infinite?: boolean

  /** The action to take after the seek finishes. If omitted, the current play state is preserved. */
  resumeState?: MediaSeekResumeState

  /** Custom application-specific data to pass along with the request. */
  customData?: AnyMap
}

/**
 * The possible states of the receiver active-input.
 *
 * Active input state can only be reported when the Google Cast device is
 * connected to a TV or AVR with CEC support.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_cast_session#a3e9f3f3f)
 */
export type ActiveInputState =
  /** It is not known (and/or not possible to know) whether the Google Cast device is the currently active video input. */
  | 'unknown'
  /** The Google Cast device is not the currently active video input. */
  | 'inactive'
  /** The Google Cast device is the currently active video input. */
  | 'active'

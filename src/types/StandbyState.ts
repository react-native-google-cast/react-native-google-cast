/**
 * The possible standby states of the receiver.
 *
 * Standby state can only be reported when the Google Cast device is connected
 * to a TV or AVR with CEC support.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/CastDevice) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_cast_session)
 */
export type StandbyState =
  /** It is not known (and/or not possible to know) whether the connected TV/AVR is in standby. */
  | 'unknown'
  /** The connected TV/AVR is not in standby. */
  | 'inactive'
  /** The connected TV/AVR is in standby. */
  | 'active'

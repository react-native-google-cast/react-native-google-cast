/**
 * The possible casting states.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastState) | [iOS](https://developers.google.com/cast/docs/reference/ios/g_c_k_cast_context#a8e7a3a3a) | [Chrome](https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.CastState)
 */
export type CastState =
  /** No cast devices are available. */
  | 'noDevicesAvailable'
  /** Cast devices are available, but a cast session is not established. */
  | 'notConnected'
  /** Cast session is being established. */
  | 'connecting'
  /** Cast session is established. */
  | 'connected'

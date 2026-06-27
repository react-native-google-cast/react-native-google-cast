/**
 * State of Google Play Services (and the Cast framework) on the device.
 *
 * Android-only; on other platforms this is always `success`.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/common/ConnectionResult)
 */
export type PlayServicesState =
  /** Play Services are available. */
  | 'success'
  /** Google Play services is missing on this device. */
  | 'missing'
  /** Google Play service is currently being updated on this device. */
  | 'updating'
  /** The installed version of Google Play services is out of date. */
  | 'updateRequired'
  /** The installed version of Google Play services has been disabled on this device. */
  | 'disabled'
  /** The installed version of Google Play services is invalid. */
  | 'invalid'

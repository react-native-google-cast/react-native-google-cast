/** State of Google Play Services (and the Cast framework) on the device. */
enum PlayServicesState {
  /** Play Services are available. */
  SUCCESS = 'success',

  /** Google Play services is missing on this device. */
  MISSING = 'missing',

  /** Google Play service is currently being updated on this device. */
  UPDATING = 'updating',

  /** The installed version of Google Play services is out of date. */
  UPDATE_REQUIRED = 'updateRequired',

  /** The installed version of Google Play services has been disabled on this device. */
  DISABLED = 'disabled',

  /** The installed version of Google Play services is out of date. */
  INVALID = 'invalid',
}

export default PlayServicesState

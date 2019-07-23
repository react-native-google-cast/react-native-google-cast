import Device from './Device'

/**
 * An instance of CastSession is automatically created by the SessionManager when the user selects a Cast device from the media route controller dialog. The current active CastSession can be accessed by getCurrentCastSession().
 *
 * A class that manages a Cast session with a receiver device.
 * Sessions are created and managed automatically by the GCKSessionManager. The application should not directly call the session lifecycle methods such as start (GCKSession(Protected)) or endWithAction: (GCKSession(Protected)).
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session} | [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession}
 */
export default class CastSession {
  /**
   * Returns the current receiver application status, if any. Message text is localized to the Google Cast device's locale.
   *
   * @returns {string}
   * @memberof CastSession
   * @see [Android: getAplicationStatus]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getApplicationStatus()}
   * @see [iOS: deviceStatusText]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a1821f77bc0c0dc159419608105483a0a}
   * @see Chrome: getApplicationStatus
   * @memberof CastSession
   */
  getApplicationStatus() {}

  /**
   *
   *
   * @returns {CastDevice}
   * @memberof CastSession
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getCastDevice()}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a30d6130e558b235e37f1cbded2d27ce8}
   */
  // getCastDevice(): Promise<Device> {}

  /**
   *
   * @returns {RemoteMediaClient}
   * @memberof CastSession
   */
  getRemoteMediaClient() {}

  /**
   *
   * @returns {number}
   * @memberof CastSession
   */
  getStandbyState() {}

  /**
   * Returns the device's volume.
   *
   * @returns {number} Volume in the range [0.0, 1.0].
   * @memberof CastSession
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#getVolume()}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#af4120ee98a679c4ed3abc6ba6b59cf12}
   */
  // getVolume(): Promise<number> {}

  /**
   * @returns {boolean}
   * @memberof CastSession
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#isMute()}
   */
  // isMute(): Promise<boolean> {}

  /**
   * Mutes or unmutes the device's audio.
   *
   * @param mute The new mute state.
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setMute(boolean)}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#aac1dc4461b6d7ae6f1f5f9dc93cafebd}
   */
  setMute(mute: boolean) {}

  /**
   * Sets the device volume.
   *
   * @param volume If volume is outside of the range [0.0, 1.0], then the value will be clipped.
   * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession.html#setVolume(double)}
   * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session#a68dcca2fdf1f4aebee394f0af56e7fb8}
   */
  setVolume(volume: number) {}
}

/**
 * Options for loading media with {@link RemoteMediaClient.loadMedia}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadOptions) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_options) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest)
 */
export default interface MediaLoadOptions {
  /** An array of integers specifying the active tracks. */
  activeTrackIds?: number[]

  /** Whether playback should start immediately. Defaults to true. */
  autoplay?: boolean

  /** The user credentials to pass along with the load request to the receiver. The credentials are completely application-specific and can be any arbitrary string. */
  credentials?: string

  /** The user credentials type to pass along with the load request to the receiver. The credentials type is completely application-specific and can be any arbitrary string. */
  credentialsType?: string

  /** The custom application-specific data to pass along with the load request. */
  customData?: object

  /** The initial playback position, in milliseconds from the beginning of the stream. */
  playPosition?: number

  /** The playback rate, as the multiplier of the normal playback rate. The accepted value is between `0.5` and `2.0`. The normal playback rate is `1.0`. */
  playbackRate?: number
}

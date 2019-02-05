// @flow

/**
 * Options for loading media with {@link RemoteMediaClient#loadMedia}.
 *
 * @class MediaLoadOptions
 * @param {Object} options
 * @param {number[]} options.activeTrackIds An array of integers specifying the active tracks.
 * @param {boolean} options.autoplay=true Whether playback should start immediately.
 * @param {string} options.credentials The user credentials to pass along with the load request to the receiver. The credentials are completely application-specific and can be any arbitrary string.
 * @param {string} options.credentialsType The user credentials type to pass along with the load request to the receiver. The credentials type is completely application-specific and can be any arbitrary string.
 * @param {Object} options.customData The custom application-specific data to pass along with the load request.
 * @param {number} options.playPosition The initial playback position, in milliseconds from the beginning of the stream.
 * @param {number} options.playbackRate The playback rate, as the multiplier of the normal playback rate. The accepted value is between `0.5` and `2.0`. The normal playback rate is `1.0`.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadOptions}
 * @see [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_options}
 * @see [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest}
 */
export default function MediaLoadOptions(options) {
  Object.assign(this, options)
}

import MediaInfo from './MediaInfo';
import MediaQueueData from './MediaQueueData';
/**
 * Options for loading media with {@link RemoteMediaClient.loadMedia}.
 *
 * When creating the request, you need to provide either `mediaInfo` if loading a single item, or `queueData` if loading a queue of items.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaLoadRequestData) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_load_request_data) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.LoadRequest)
 */
export default interface MediaLoadRequest {
    /**
     * Whether playback should start immediately. Defaults to `true`.
     *
     * When set to `null` while loading a queue, the first queue item's `autoplay` property will be used to determine whether to play automatically.
     */
    autoplay?: boolean | null;
    /** The user credentials to pass along with the load request to the receiver. The credentials are completely application-specific and can be any arbitrary string. */
    credentials?: string;
    /** The user credentials type to pass along with the load request to the receiver. The credentials type is completely application-specific and can be any arbitrary string. */
    credentialsType?: string;
    /** The custom application-specific data to pass along with the load request. */
    customData?: object;
    /** The media item to load. Either this or `queueData` is required. */
    mediaInfo?: MediaInfo;
    /** The playback rate, as the multiplier of the normal playback rate. The accepted value is between `0.5` and `2.0`. The normal playback rate is `1.0`. */
    playbackRate?: number;
    /** The metadata of media item or queue to load. Either this or `mediaInfo` is required. */
    queueData?: MediaQueueData;
    /** The initial playback position, in seconds from the beginning of the media. */
    startTime?: number;
}

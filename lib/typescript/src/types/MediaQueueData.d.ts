import MediaQueueContainerMetadata from './MediaQueueContainerMetadata';
import MediaQueueItem from './MediaQueueItem';
import MediaQueueType from './MediaQueueType';
import MediaRepeatMode from './MediaRepeatMode';
/**
 * A class that holds the information of the playing queue or media container.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueData) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_data) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.QueueData)
 */
export default interface MediaQueueData {
    /** Additional description for the queue, including an optional list of media sections metadata, images, etc. */
    containerMetadata?: MediaQueueContainerMetadata;
    /** The deep link for the media as used by Google Assistant, if any (for example, the deep link of an album, playlist or radio station). */
    entity?: string;
    /** ID of the queue. */
    id?: string;
    /** The items to be loaded in the queue. */
    items?: MediaQueueItem[];
    /** Display name of the queue. */
    name?: string;
    /** How to repeat the queue. */
    repeatMode?: MediaRepeatMode;
    /** The index of the item in the queue that should be used to start playback first. Only valid for load requests. */
    startIndex?: number;
    /** Seconds (since the beginning of content) to start playback of the first item. Only valid for load requests. */
    startTime?: number;
    /** Type of the queue. */
    type?: MediaQueueType;
}

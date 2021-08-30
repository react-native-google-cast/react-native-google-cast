import MediaInfo from './MediaInfo';
/**
 * A type representing a media queue item.
 *
 * This type is used in two-way communication between a sender application and a receiver application. The sender constructs them to load or insert a list of media items on the receiver application. The {@link MediaStatus} from the receiver also contains the list of items represented as this type.
 *
 * Once loaded, the receiver will assign a unique item ID to each `MediaQueueItem`, even if the same media gets loaded multiple times.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueItem) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_item) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.QueueItem)
 */
export default interface MediaQueueItem {
    /** Array of {@link MediaTrack} IDs that should be active. The provided trackIds need to be those from `mediaInfo.mediaTracks[].id`. If two incompatible trackIds are provided (for example two active audio tracks) the command will fail with INVALID_PARAMETER. */
    activeTrackIds?: number[];
    /** Whether the item should automatically start playback when it becomes the current item in the queue. If `false`, the queue will pause when it reaches this item. The default value is `true`. */
    autoplay?: boolean;
    /** Custom data, if any. */
    customData?: object;
    /** Unique identifier of the item in the queue. If used in QueueLoad or QueueInsert it must be `undefined` (as it will be assigned by the receiver when an item is first created/inserted). For other operations it is mandatory. */
    itemId?: number;
    /** The media information associated with this item. */
    mediaInfo: MediaInfo;
    /** The playback duration for the item, in seconds, or `undefined` if the stream's actual duration should be used. */
    playbackDuration?: number;
    /** This parameter is a hint for the receiver to preload this media item before it is played. It allows for a smooth transition between items played from the queue. The time is expressed in seconds, relative to the beginning of this item playback (usually the end of the previous item playback). Only positive values are valid. For example, if the value is 10 seconds, this item will be preloaded 10 seconds before the previous item has finished. The receiver will try to honor this value but will not guarantee it, for example if the value is larger than the previous item duration the receiver may just preload this item shortly after the previous item has started playing (there will never be two items being preloaded in parallel). Also, if an item is inserted in the queue just after the currentItem and the time to preload is higher than the time left on the currentItem, the preload will just happen as soon as possible. */
    preloadTime?: number;
    /** Number of seconds from the beginning of the media to start playback. */
    startTime?: number;
}

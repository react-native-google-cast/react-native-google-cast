import MediaMetadata from './MediaMetadata';
import MediaQueueContainerType from './MediaQueueContainerType';
import WebImage from './WebImage';
/**
 * Additional metadata for the media queue container.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/MediaQueueContainerMetadata) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_media_queue_container_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/chrome.cast.media.ContainerMetadata)
 */
export default interface MediaQueueContainerMetadata {
    /** The total playback time in seconds. */
    containerDuration?: number;
    /** Images associated with the queue. By default the first image is used when displaying queue information. Used for audio book image, a TV Channel logo, album cover, etc. */
    containerImages?: WebImage[];
    /** The type of metadata. */
    containerType?: MediaQueueContainerType;
    /** The metadata of each section that a media stream contains. */
    sections?: MediaMetadata[];
    /** The container title. It can be audiobook title, Live TV Channel name, album name or playlist name, etc. */
    title?: string;
}

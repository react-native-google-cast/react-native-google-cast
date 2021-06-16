import { EmitterSubscription } from 'react-native';
import MediaLoadRequest from 'src/types/MediaLoadRequest';
import { MediaSeekOptions } from 'src/types/MediaSeekOptions';
import TextTrackStyle from 'src/types/TextTrackStyle';
import MediaQueueItem from '../types/MediaQueueItem';
import MediaStatus from '../types/MediaStatus';
/**
 * Class for controlling a media player application running on a Cast receiver.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client) _GCKRemoteMediaClient_  | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer) _RemotePlayer_
 *
 * @example
 * ```js
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   if (client) {
 *     // ...
 *   }
 * }
 * ```
 */
export default class RemoteMediaClient {
    /**
     * The current media status, or `null` if there isn't a media session.
     */
    getMediaStatus(): Promise<MediaStatus | null>;
    /**
     * The current stream position, or `null` if there isn't a media session.
     */
    getStreamPosition(): Promise<number | null>;
    /**
     * Loads and starts playback of a media item or a queue of media items with a request data.
     *
     * @example
     * ```ts
     * client.loadMedia({
     *   autoplay: true,
     *   mediaInfo: {
     *     contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
     *   }
     * })
     * ```
     */
    loadMedia(request: MediaLoadRequest): Promise<void>;
    /**
     * Pauses playback of the current media item.
     *
     * The request will fail if there is no current media status.
     *
     * @param customData Custom application-specific data to pass along with the request.
     */
    pause(customData?: object): Promise<void>;
    /**
     * Begins (or resumes) playback of the current media item.
     *
     * Playback always begins at the beginning of the stream. The request will fail if there is no current media status.
     *
     * @param customData Custom application-specific data to pass along with the request.
     */
    play(customData?: object): Promise<void>;
    /**
     * Inserts a single item into the queue and starts playing it at the specified position.
     *
     * @param item The item to insert.
     * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
     * @param playPosition The initial playback position for the item when it is first played, relative to the beginning of the stream. This value is ignored when the same item is played again, for example when the queue repeats, or the item is later jumped to. In those cases the item's `startTime` is used.
     * @param customData Custom application-specific data to pass along with the request.
     */
    queueInsertAndPlayItem(item: MediaQueueItem, beforeItemId?: number, playPosition?: number, customData?: object): Promise<void>;
    /**
     * Inserts a single item into the queue.
     *
     * @param item The item to insert.
     * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
     * @param customData Custom application-specific data to pass along with the request.
     */
    queueInsertItem(item: MediaQueueItem, beforeItemId?: number | null, customData?: object): Promise<void>;
    /**
     * Inserts a list of new media items into the queue.
     *
     * @param items List of items to insert into the queue, in the order that they should be played. The `itemId` field of the items should be unassigned.
     * @param beforeItemId The ID of the item that will be located immediately after the inserted list. If the value is `null`, or does not refer to any item currently in the queue, the inserted list will be appended to the end of the queue.
     * @param customData Custom application-specific data to pass along with the request.
     */
    queueInsertItems(items: MediaQueueItem[], beforeItemId?: number | null, customData?: object): Promise<void>;
    /**
     * Moves to the next item in the queue.
     *
     * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
     */
    queueNext(customData?: object): Promise<void>;
    /**
     * Moves to the previous item in the queue.
     *
     * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
     */
    queuePrev(customData?: object): Promise<void>;
    /**
     * Seeks to a new position within the current media item.
     */
    seek(options: MediaSeekOptions): Promise<void>;
    /**
     * @deprecated Use `setActiveTrackIds` instead.
     */
    setActiveMediaTracks(trackIds?: number[]): Promise<void>;
    /**
     * Sets the active media tracks.
     *
     * The request will fail if there is no current media status.
     *
     * @param trackIds The media track IDs. If `undefined` or an empty array, the current set of active trackIds will be removed, and default ones will be used instead.
     */
    setActiveTrackIds(trackIds?: number[]): Promise<void>;
    /**
     * Sets the playback rate for the current media session.
     *
     * @param playbackRate The new playback rate, between `0.5` and `2.0`. The normal rate is `1.0`.
     * @param customData Custom application-specific data to pass along with the request.
     */
    setPlaybackRate(playbackRate: number, customData?: object): Promise<void>;
    /**
     * Sets whether the stream is muted.
     *
     * The request will fail if there is no current media session.
     *
     * @param muted Whether the stream should be muted or unmuted.
     * @param customData Custom application-specific data to pass along with the request.
     */
    setStreamMuted(muted: boolean, customData?: object): Promise<void>;
    /**
     * Sets the stream volume.
     *
     * @param volume The new volume, between `0.0` and `1.0`.
     * @param customData Custom application-specific data to pass along with the request.
     */
    setStreamVolume(volume: number, customData?: object): Promise<void>;
    /**
     * Sets the text track style.
     *
     * The request will fail if there is no current media status.
     *
     * @param textTrackStyle The text track style.
     */
    setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void>;
    /**
     * Stops playback of the current media item.
     *
     * If a queue is currently loaded, it will be removed. The request will fail if there is no current media status.
     *
     * @param customData Custom application-specific data to pass along with the request.
     */
    stop(customData?: object): Promise<void>;
    /** Called when media status changes. */
    onMediaStatusUpdated(handler: (mediaStatus: MediaStatus | null) => void): EmitterSubscription;
    /** Called when finished playback of an item. */
    onMediaPlaybackEnded(handler: (mediaStatus: MediaStatus | null) => void): EmitterSubscription;
    /** Called when started playback of an item. */
    onMediaPlaybackStarted(handler: (mediaStatus: MediaStatus | null) => void): EmitterSubscription;
    private progressUpdateListener?;
    /**
     * Listen for updates on the progress of the currently playing media. Only one listener can be attached; when you attach another listener, the previous one will be removed. All times are in seconds.
     *
     * @param handler called when progress or duration of the currently playing media changes.
     * @param interval update frequency (defaults to 1 second)
     */
    onMediaProgressUpdated(handler: (progress: number, duration: number) => void, interval?: number): {
        remove: () => void;
    };
}

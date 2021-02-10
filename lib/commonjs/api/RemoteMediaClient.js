"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

var _reactNativeGoogleCast = require("react-native-google-cast");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  RNGCRemoteMediaClient: Native
} = _reactNative.NativeModules;
const EventEmitter = new _reactNative.NativeEventEmitter(Native);
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

class RemoteMediaClient {
  constructor() {
    _defineProperty(this, "progressUpdateListener", void 0);
  }

  // getMediaQueue(): Promise<MediaQueue> {
  // }

  /**
   * The current media status, or `null` if there isn't a media session.
   */
  getMediaStatus() {
    return Native.getMediaStatus();
  }
  /**
   * The current stream position, or `null` if there isn't a media session.
   */


  getStreamPosition() {
    return Native.getStreamPosition();
  }
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


  loadMedia(request) {
    return Native.loadMedia(request);
  }
  /**
   * Pauses playback of the current media item.
   *
   * The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */


  pause(customData) {
    return Native.pause(customData);
  }
  /**
   * Begins (or resumes) playback of the current media item.
   *
   * Playback always begins at the beginning of the stream. The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */


  play(customData) {
    return Native.play(customData);
  }
  /**
   * Inserts a single item into the queue and starts playing it at the specified position.
   *
   * @param item The item to insert.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
   * @param playPosition The initial playback position for the item when it is first played, relative to the beginning of the stream. This value is ignored when the same item is played again, for example when the queue repeats, or the item is later jumped to. In those cases the item's `startTime` is used.
   * @param customData Custom application-specific data to pass along with the request.
   */


  queueInsertAndPlayItem(item, beforeItemId, playPosition, customData) {
    return Native.queueInsertAndPlayItem(item, beforeItemId || 0, playPosition || 0, customData);
  }
  /**
   * Inserts a single item into the queue.
   *
   * @param item The item to insert.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted item. If the value is `null`, or does not refer to any item currently in the queue, the inserted item will be appended to the end of the queue.
   * @param customData Custom application-specific data to pass along with the request.
   */


  queueInsertItem(item, beforeItemId, customData) {
    return this.queueInsertItems([item], beforeItemId, customData);
  }
  /**
   * Inserts a list of new media items into the queue.
   *
   * @param items List of items to insert into the queue, in the order that they should be played. The `itemId` field of the items should be unassigned.
   * @param beforeItemId The ID of the item that will be located immediately after the inserted list. If the value is `null`, or does not refer to any item currently in the queue, the inserted list will be appended to the end of the queue.
   * @param customData Custom application-specific data to pass along with the request.
   */


  queueInsertItems(items, beforeItemId, customData) {
    return Native.queueInsertItems(items, beforeItemId || 0, customData);
  }
  /**
   * Moves to the next item in the queue.
   *
   * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
   */


  queueNext(customData) {
    return Native.queueNext(customData);
  }
  /**
   * Moves to the previous item in the queue.
   *
   * @param customData Custom application-specific data to pass along with the request. (Currently Android only. On iOS `customData` will be ignored.)
   */


  queuePrev(customData) {
    return Native.queuePrev(customData);
  }
  /**
   * Seeks to a new position within the current media item.
   */


  seek(options) {
    return Native.seek(options);
  }
  /**
   * @deprecated Use `setActiveTrackIds` instead.
   */


  setActiveMediaTracks(trackIds = []) {
    return Native.setActiveTrackIds(trackIds);
  }
  /**
   * Sets the active media tracks.
   *
   * The request will fail if there is no current media status.
   *
   * @param trackIds The media track IDs. If `undefined` or an empty array, the current set of active trackIds will be removed, and default ones will be used instead.
   */


  setActiveTrackIds(trackIds = []) {
    return Native.setActiveTrackIds(trackIds);
  }
  /**
   * Sets the playback rate for the current media session.
   *
   * @param playbackRate The new playback rate, between `0.5` and `2.0`. The normal rate is `1.0`.
   * @param customData Custom application-specific data to pass along with the request.
   */


  setPlaybackRate(playbackRate, customData) {
    return Native.setPlaybackRate(playbackRate, customData);
  }
  /**
   * Sets whether the stream is muted.
   *
   * The request will fail if there is no current media session.
   *
   * @param muted Whether the stream should be muted or unmuted.
   * @param customData Custom application-specific data to pass along with the request.
   */


  setStreamMuted(muted, customData) {
    return Native.setStreamMuted(muted, customData);
  }
  /**
   * Sets the stream volume.
   *
   * @param volume The new volume, between `0.0` and `1.0`.
   * @param customData Custom application-specific data to pass along with the request.
   */


  setStreamVolume(volume, customData) {
    return Native.setStreamVolume(volume, customData);
  }
  /**
   * Sets the text track style.
   *
   * The request will fail if there is no current media status.
   *
   * @param textTrackStyle The text track style.
   */


  setTextTrackStyle(textTrackStyle) {
    return Native.setTextTrackStyle(textTrackStyle);
  }
  /**
   * Stops playback of the current media item.
   *
   * If a queue is currently loaded, it will be removed. The request will fail if there is no current media status.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */


  stop(customData) {
    return Native.stop(customData);
  } // ========== //
  //   EVENTS   //
  // ========== //

  /** Called when media status changes. */


  onMediaStatusUpdated(handler) {
    return EventEmitter.addListener(Native.MEDIA_STATUS_UPDATED, handler);
  }
  /** Called when finished playback of an item. */


  onMediaPlaybackEnded(handler) {
    let currentItemId;
    let playbackEnded = false;
    return this.onMediaStatusUpdated(mediaStatus => {
      if (currentItemId !== (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.currentItemId)) {
        currentItemId = mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.currentItemId;
        playbackEnded = false;
      }

      if (playbackEnded) return;
      if ((mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.idleReason) !== _reactNativeGoogleCast.MediaPlayerIdleReason.FINISHED) return;
      playbackEnded = true;
      handler(mediaStatus);
    });
  }
  /** Called when started playback of an item. */


  onMediaPlaybackStarted(handler) {
    let currentItemId;
    let playbackStarted = false;
    return this.onMediaStatusUpdated(mediaStatus => {
      if (currentItemId !== (mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.currentItemId)) {
        currentItemId = mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.currentItemId;
        playbackStarted = false;
      }

      if (playbackStarted) return;
      if ((mediaStatus === null || mediaStatus === void 0 ? void 0 : mediaStatus.playerState) !== _reactNativeGoogleCast.MediaPlayerState.PLAYING) return;
      playbackStarted = true;
      handler(mediaStatus);
    });
  }

  /**
   * Listen for updates on the progress of the currently playing media. Only one listener can be attached; when you attach another listener, the previous one will be removed. All times are in seconds.
   *
   * @param handler called when progress or duration of the currently playing media changes.
   * @param interval update frequency (defaults to 1 second)
   */
  onMediaProgressUpdated(handler, interval = 1) {
    var _this$progressUpdateL;

    Native.setProgressUpdateInterval(interval);
    (_this$progressUpdateL = this.progressUpdateListener) === null || _this$progressUpdateL === void 0 ? void 0 : _this$progressUpdateL.remove();
    this.progressUpdateListener = EventEmitter.addListener(Native.MEDIA_PROGRESS_UPDATED, ([progress, duration]) => handler(progress, duration));
    return {
      remove: () => {
        var _this$progressUpdateL2;

        Native.setProgressUpdateInterval(0);
        (_this$progressUpdateL2 = this.progressUpdateListener) === null || _this$progressUpdateL2 === void 0 ? void 0 : _this$progressUpdateL2.remove();
        this.progressUpdateListener = undefined;
      }
    };
  }

}

exports.default = RemoteMediaClient;
//# sourceMappingURL=RemoteMediaClient.js.map
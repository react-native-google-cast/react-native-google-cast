/** Possible states of the media player. */
var MediaPlayerState;

(function (MediaPlayerState) {
  MediaPlayerState["BUFFERING"] = "buffering";
  MediaPlayerState["IDLE"] = "idle";
  MediaPlayerState["LOADING"] = "loading";
  MediaPlayerState["PAUSED"] = "paused";
  MediaPlayerState["PLAYING"] = "playing";
})(MediaPlayerState || (MediaPlayerState = {}));

export default MediaPlayerState;
//# sourceMappingURL=MediaPlayerState.js.map
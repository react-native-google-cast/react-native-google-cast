"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/** Possible states of the media player. */
var MediaPlayerState;

(function (MediaPlayerState) {
  MediaPlayerState["BUFFERING"] = "buffering";
  MediaPlayerState["IDLE"] = "idle";
  MediaPlayerState["LOADING"] = "loading";
  MediaPlayerState["PAUSED"] = "paused";
  MediaPlayerState["PLAYING"] = "playing";
})(MediaPlayerState || (MediaPlayerState = {}));

var _default = MediaPlayerState;
exports.default = _default;
//# sourceMappingURL=MediaPlayerState.js.map
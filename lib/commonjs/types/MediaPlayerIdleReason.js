"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/** Possible reason why a media is idle. */
var MediaPlayerIdleReason;

(function (MediaPlayerIdleReason) {
  MediaPlayerIdleReason["CANCELLED"] = "cancelled";
  MediaPlayerIdleReason["ERROR"] = "error";
  MediaPlayerIdleReason["FINISHED"] = "finished";
  MediaPlayerIdleReason["INTERRUPTED"] = "interrupted";
})(MediaPlayerIdleReason || (MediaPlayerIdleReason = {}));

var _default = MediaPlayerIdleReason;
exports.default = _default;
//# sourceMappingURL=MediaPlayerIdleReason.js.map
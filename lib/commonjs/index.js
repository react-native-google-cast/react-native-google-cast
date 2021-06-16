"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "CastContext", {
  enumerable: true,
  get: function () {
    return _CastContext.default;
  }
});
Object.defineProperty(exports, "CastChannel", {
  enumerable: true,
  get: function () {
    return _CastChannel.default;
  }
});
Object.defineProperty(exports, "CastSession", {
  enumerable: true,
  get: function () {
    return _CastSession.default;
  }
});
Object.defineProperty(exports, "DiscoveryManager", {
  enumerable: true,
  get: function () {
    return _DiscoveryManager.default;
  }
});
Object.defineProperty(exports, "RemoteMediaClient", {
  enumerable: true,
  get: function () {
    return _RemoteMediaClient.default;
  }
});
Object.defineProperty(exports, "SessionManager", {
  enumerable: true,
  get: function () {
    return _SessionManager.default;
  }
});
Object.defineProperty(exports, "useCastChannel", {
  enumerable: true,
  get: function () {
    return _useCastChannel.default;
  }
});
Object.defineProperty(exports, "useCastState", {
  enumerable: true,
  get: function () {
    return _useCastState.default;
  }
});
Object.defineProperty(exports, "useCastSession", {
  enumerable: true,
  get: function () {
    return _useCastSession.default;
  }
});
Object.defineProperty(exports, "useMediaStatus", {
  enumerable: true,
  get: function () {
    return _useMediaStatus.default;
  }
});
Object.defineProperty(exports, "useRemoteMediaClient", {
  enumerable: true,
  get: function () {
    return _useRemoteMediaClient.default;
  }
});
Object.defineProperty(exports, "useStreamPosition", {
  enumerable: true,
  get: function () {
    return _useStreamPosition.default;
  }
});
Object.defineProperty(exports, "CastButton", {
  enumerable: true,
  get: function () {
    return _CastButton.default;
  }
});
Object.defineProperty(exports, "ActiveInputState", {
  enumerable: true,
  get: function () {
    return _ActiveInputState.default;
  }
});
Object.defineProperty(exports, "CastState", {
  enumerable: true,
  get: function () {
    return _CastState.default;
  }
});
Object.defineProperty(exports, "MediaPlayerIdleReason", {
  enumerable: true,
  get: function () {
    return _MediaPlayerIdleReason.default;
  }
});
Object.defineProperty(exports, "MediaPlayerState", {
  enumerable: true,
  get: function () {
    return _MediaPlayerState.default;
  }
});
Object.defineProperty(exports, "MediaQueueContainerType", {
  enumerable: true,
  get: function () {
    return _MediaQueueContainerType.default;
  }
});
Object.defineProperty(exports, "MediaQueueType", {
  enumerable: true,
  get: function () {
    return _MediaQueueType.default;
  }
});
Object.defineProperty(exports, "MediaRepeatMode", {
  enumerable: true,
  get: function () {
    return _MediaRepeatMode.default;
  }
});
Object.defineProperty(exports, "MediaStreamType", {
  enumerable: true,
  get: function () {
    return _MediaStreamType.default;
  }
});
Object.defineProperty(exports, "StandbyState", {
  enumerable: true,
  get: function () {
    return _StandbyState.default;
  }
});
exports.MediaMetadata = exports.default = void 0;

var _CastContext = _interopRequireDefault(require("./api/CastContext"));

var _CastChannel = _interopRequireDefault(require("./api/CastChannel"));

var _CastSession = _interopRequireDefault(require("./api/CastSession"));

var _DiscoveryManager = _interopRequireDefault(require("./api/DiscoveryManager"));

var _RemoteMediaClient = _interopRequireDefault(require("./api/RemoteMediaClient"));

var _SessionManager = _interopRequireDefault(require("./api/SessionManager"));

var _useCastChannel = _interopRequireDefault(require("./api/useCastChannel"));

var _useCastState = _interopRequireDefault(require("./api/useCastState"));

var _useCastSession = _interopRequireDefault(require("./api/useCastSession"));

var _useMediaStatus = _interopRequireDefault(require("./api/useMediaStatus"));

var _useRemoteMediaClient = _interopRequireDefault(require("./api/useRemoteMediaClient"));

var _useStreamPosition = _interopRequireDefault(require("./api/useStreamPosition"));

var _CastButton = _interopRequireDefault(require("./components/CastButton"));

var _ActiveInputState = _interopRequireDefault(require("./types/ActiveInputState"));

var _CastState = _interopRequireDefault(require("./types/CastState"));

var MediaMetadata = _interopRequireWildcard(require("./types/MediaMetadata"));

exports.MediaMetadata = MediaMetadata;

var _MediaPlayerIdleReason = _interopRequireDefault(require("./types/MediaPlayerIdleReason"));

var _MediaPlayerState = _interopRequireDefault(require("./types/MediaPlayerState"));

var _MediaQueueContainerType = _interopRequireDefault(require("./types/MediaQueueContainerType"));

var _MediaQueueType = _interopRequireDefault(require("./types/MediaQueueType"));

var _MediaRepeatMode = _interopRequireDefault(require("./types/MediaRepeatMode"));

var _MediaStreamType = _interopRequireDefault(require("./types/MediaStreamType"));

var _StandbyState = _interopRequireDefault(require("./types/StandbyState"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _CastContext.default;
exports.default = _default;
//# sourceMappingURL=index.js.map
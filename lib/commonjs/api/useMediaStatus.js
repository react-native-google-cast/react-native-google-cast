"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useMediaStatus;

var _react = require("react");

var _useRemoteMediaClient = _interopRequireDefault(require("./useRemoteMediaClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook to retrieve current media status.
 *
 * Note that the media status is only updated when the status of the stream changes. Therefore, `mediaStatus.streamPosition` only reflects the time of the last status update.
 * If you need to know the current progress in near real-time, see `useStreamPosition` instead.
 *
 * @returns current media status, or `null` if there's no current media
 */
function useMediaStatus() {
  const client = (0, _useRemoteMediaClient.default)();
  const [mediaStatus, setMediaStatus] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    if (!client) {
      setMediaStatus(null);
      return;
    }

    client.getMediaStatus().then(setMediaStatus);
    const subscription = client.onMediaStatusUpdated(setMediaStatus);
    return () => {
      subscription.remove();
    };
  }, [client]);
  return mediaStatus;
}
//# sourceMappingURL=useMediaStatus.js.map
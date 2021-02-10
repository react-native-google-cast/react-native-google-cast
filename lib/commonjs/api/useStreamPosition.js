"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useStreamPosition;

var _react = require("react");

var _useRemoteMediaClient = _interopRequireDefault(require("./useRemoteMediaClient"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook to retrieve current stream position.
 *
 * @param {number} [interval] update interval (defaults to 1 second)
 * @returns current position in seconds, or `null` if there's no current media
 */
function useStreamPosition(interval) {
  const client = (0, _useRemoteMediaClient.default)();
  const [streamPosition, setStreamPosition] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    if (!client) {
      setStreamPosition(null);
      return;
    }

    client.getStreamPosition().then(setStreamPosition);
    const subscription = client.onMediaProgressUpdated(setStreamPosition, interval);
    return () => {
      subscription.remove();
    };
  }, [client, interval]);
  return streamPosition;
}
//# sourceMappingURL=useStreamPosition.js.map
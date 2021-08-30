"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useRemoteMediaClient;

var _useCastSession = _interopRequireDefault(require("./useCastSession"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook that provides the current {@link RemoteMediaClient}.
 *
 * @returns current client, or `null` if there's no session connected
 * @example
 * ```js
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   if (client) {
 *     client.loadMedia(...)
 *   }
 * }
 * ```
 */
function useRemoteMediaClient() {
  const castSession = (0, _useCastSession.default)();
  return castSession ? castSession.client : null;
}
//# sourceMappingURL=useRemoteMediaClient.js.map
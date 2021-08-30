"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useCastSession;

var _react = require("react");

var _SessionManager = _interopRequireDefault(require("./SessionManager"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook that provides the current {@link CastSession}.
 *
 * @returns current session, or `null` if there's no session connected
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castSession = useCastSession()
 *
 *   if (castSession) {
 *     castSession.client.loadMedia(...)
 *   }
 * }
 * ```
 */
function useCastSession() {
  const [castSession, setCastSession] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    manager.getCurrentCastSession().then(setCastSession);
    const started = manager.onSessionStarted(setCastSession);
    const resumed = manager.onSessionResumed(setCastSession);
    const ended = manager.onSessionEnded(() => setCastSession(null));
    return () => {
      started.remove();
      resumed.remove();
      ended.remove();
    };
  }, []);
  return castSession;
}

const manager = new _SessionManager.default();
//# sourceMappingURL=useCastSession.js.map
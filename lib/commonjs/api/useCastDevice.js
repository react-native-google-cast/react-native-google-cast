"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useCastDevice;

var _react = require("react");

var _useCastSession = _interopRequireDefault(require("./useCastSession"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook that provides the currently connected {@link Device}.
 *
 * @returns current device, or `null` if there's no session connected
 * @example
 * ```js
 * import { useCastDevice } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castDevice = useCastDevice()
 *
 *   if (castDevice) {
 *     console.log(castDevice)
 *   }
 * }
 * ```
 */
function useCastDevice() {
  const [device, setDevice] = (0, _react.useState)(null);
  const session = (0, _useCastSession.default)();
  (0, _react.useEffect)(() => {
    if (!session) setDevice(null);else session.getCastDevice().then(setDevice);
  }, [session]);
  return device;
}
//# sourceMappingURL=useCastDevice.js.map
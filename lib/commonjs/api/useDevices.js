"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useDevices;

var _react = require("react");

var _CastContext = _interopRequireDefault(require("./CastContext"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Hook that listens to changes to available devices and returns current list.
 */
function useDevices() {
  const discoveryManager = _CastContext.default.getDiscoveryManager();

  const [devices, setDevices] = (0, _react.useState)([]);
  (0, _react.useEffect)(() => {
    discoveryManager.getDevices().then(setDevices);
    const listener = discoveryManager.onDevicesUpdated(setDevices);
    return () => {
      listener.remove();
    };
  }, [discoveryManager]);
  return devices;
}
//# sourceMappingURL=useDevices.js.map
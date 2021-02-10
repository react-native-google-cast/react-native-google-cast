"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useCastState;

var _react = require("react");

var _CastContext = _interopRequireDefault(require("./CastContext"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function useCastState() {
  const [castState, setCastState] = (0, _react.useState)();
  (0, _react.useEffect)(() => {
    _CastContext.default.getCastState().then(setCastState);

    const changed = _CastContext.default.onCastStateChanged(setCastState);

    return () => {
      changed.remove();
    };
  }, []);
  return castState;
}
//# sourceMappingURL=useCastState.js.map
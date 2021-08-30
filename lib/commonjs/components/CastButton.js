"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CastButton;

var _react = _interopRequireDefault(require("react"));

var _reactNative = require("react-native");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Button that presents the Cast icon.
 *
 * By default, upon pressing the button it opens the native Cast dialog.
 *
 * @see [GCKUICastButton](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_u_i_cast_button) (iOS)
 * @see [CastButtonFactory](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastButtonFactory) & [MediaRouteButton](https://developer.android.com/reference/android/support/v7/app/MediaRouteButton.html) (Android)
 */
function CastButton(props) {
  return /*#__PURE__*/_react.default.createElement(GoogleCastButton, props);
}

CastButton.propTypes = {
  /**
   * A flag that indicates whether a touch event on this button will trigger the display of the Cast dialog that is provided by the framework.
   *
   * By default this property is set to YES. If an application wishes to handle touch events itself, it should set the property to NO and register an appropriate target and action for the touch event.
   */
  // triggersDefaultCastDialog: PropTypes.bool
  // accessibilityLabel: PropTypes.string
};
const GoogleCastButton = (0, _reactNative.requireNativeComponent)('RNGoogleCastButton' // CastButton
// {
//   nativeOnly: {
//     accessibilityLabel: true,
//     accessibilityLiveRegion: true,
//     accessibilityComponentType: true,
//     testID: true,
//     nativeID: true,
//     importantForAccessibility: true,
//     renderToHardwareTextureAndroid: true,
//     onLayout: true,
//   },
// }
);
//# sourceMappingURL=CastButton.js.map
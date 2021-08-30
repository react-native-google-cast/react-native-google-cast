import { ViewProps } from 'react-native';
export interface Props extends ViewProps {
    style?: ViewProps['style'] & {
        tintColor?: string;
    };
    tintColor?: string;
}
/**
 * Button that presents the Cast icon.
 *
 * By default, upon pressing the button it opens the native Cast dialog.
 *
 * @see [GCKUICastButton](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_u_i_cast_button) (iOS)
 * @see [CastButtonFactory](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastButtonFactory) & [MediaRouteButton](https://developer.android.com/reference/android/support/v7/app/MediaRouteButton.html) (Android)
 */
declare function CastButton(props: Props): JSX.Element;
declare namespace CastButton {
    var propTypes: {};
}
export default CastButton;

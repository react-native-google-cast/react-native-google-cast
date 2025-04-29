import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

export interface Props extends ViewProps {
  style?: ViewProps['style']
}

/**
 * A mini controller component that displays the currently playing media and provides basic playback controls.
 * This component should be shown when the user navigates away from the main content page while casting.
 *
 * Uses the native mini controller from the Google Cast SDK:
 * @see [GCKUIMiniMediaControlsViewController](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_u_i_mini_media_controls_view_controller) (iOS)
 * @see [MiniControllerFragment](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/widget/MiniControllerFragment) (Android)
 */
export default function MiniController(props: Props) {
  return <GoogleCastMiniController {...props} />
}

const GoogleCastMiniController = requireNativeComponent(
  'RNGoogleCastMiniController'
)

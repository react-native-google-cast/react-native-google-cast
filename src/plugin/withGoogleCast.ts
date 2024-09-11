import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins'

import { withAndroidGoogleCast } from './withAndroidGoogleCast'
import { withIosGoogleCast } from './withIosGoogleCast'

const withGoogleCast: ConfigPlugin<
  {
    /**
     * Version for the Android Cast SDK.
     *
     * @default '+' (latest)
     */
    androidPlayServicesCastFrameworkVersion?: string

    androidReceiverAppId?: string

    /**
     * Whether to use the default expanded controller.
     *
     * @default true
     * @see https://react-native-google-cast.github.io/docs/components/ExpandedController
     */
    expandedController?: boolean

    /**
     * Whether the discovery of Cast devices should not start automatically at context initialization time.
     *
     * @default false
     * @see https://react-native-google-cast.github.io/docs/getting-started/setup#ios
     */
    iosDisableDiscoveryAutostart?: boolean

    iosReceiverAppId?: string

    /**
     * Whether cast devices discovery start only after a user taps on the Cast button the first time.
     *
     * @default true
     * @see https://react-native-google-cast.github.io/docs/getting-started/setup#ios
     */
    iosStartDiscoveryAfterFirstTapOnCastButton?: boolean

    /**
     * Whether sessions should be suspended when the sender application goes into the background (and resumed when it returns to the foreground). You can set this to `false` in applications that are able to maintain network connections indefinitely while in the background.
     *
     * @default true
     */
    iosSuspendSessionsWhenBackgrounded?: boolean

    /**
     * Custom receiver app id. Same as setting both `iosReceiverAppId` and `androidReceiverAppId`.
     *
     * @default 'CC1AD845'
     */
    receiverAppId?: string
  } | void
> = (config, _props) => {
  const props = _props || {}
  config = withIosGoogleCast(config, {
    receiverAppId: props.iosReceiverAppId ?? props.receiverAppId,
    disableDiscoveryAutostart: props.iosDisableDiscoveryAutostart,
    expandedController: props.expandedController ?? true,
    suspendSessionsWhenBackgrounded: props.iosSuspendSessionsWhenBackgrounded,
    startDiscoveryAfterFirstTapOnCastButton:
      props.iosStartDiscoveryAfterFirstTapOnCastButton,
  })

  config = withAndroidGoogleCast(config, {
    receiverAppId: props.androidReceiverAppId ?? props.receiverAppId,
    expandedController: props.expandedController,
    androidPlayServicesCastFrameworkVersion:
      props.androidPlayServicesCastFrameworkVersion,
  })

  return config
}

export default createRunOncePlugin(withGoogleCast, 'react-native-google-cast')

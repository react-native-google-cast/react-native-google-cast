import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins'

import { withAndroidGoogleCast } from './withAndroidGoogleCast'
import { withIosGoogleCast } from './withIosGoogleCast'

const withGoogleCast: ConfigPlugin<
  {
    /**
     * @default '+'
     */
    androidPlayServicesCastFrameworkVersion?: string

    /**
     * @default 'CC1AD845'
     */
    iosReceiverAppId?: string

    /**
     * ??
     */
    androidReceiverAppId?: string
  } | void
> = (config, _props) => {
  const props = _props || {}
  // TODO: Are the Android and iOS receiverAppId values the same?
  config = withIosGoogleCast(config, {
    receiverAppId: props.iosReceiverAppId,
    // disableDiscoveryAutostart?: boolean;
    // startDiscoveryAfterFirstTapOnCastButton?: boolean;
  })

  config = withAndroidGoogleCast(config, {
    receiverAppId: props.androidReceiverAppId,
    androidPlayServicesCastFrameworkVersion:
      props.androidPlayServicesCastFrameworkVersion,
  })

  return config
}

export default createRunOncePlugin(withGoogleCast, 'react-native-google-cast')

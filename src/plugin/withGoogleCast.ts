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

    /**
     * Whether the library's `NitroCastOptionsProvider` shows media
     * notifications (and lock-screen controls) during a session. `false`
     * writes the `com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED`
     * meta-data; when `true` (default) nothing is written.
     *
     * This is meta-data consumed by `NitroCastOptionsProvider` (or subclasses
     * that call `super`) — a from-scratch `androidOptionsProvider` ignores it.
     *
     * @default true
     */
    androidNotificationsEnabled?: boolean

    /**
     * Fully-qualified class name of a custom Android `OptionsProvider`,
     * written to the `OPTIONS_PROVIDER_CLASS_NAME` meta-data. When set, the
     * `receiverAppId`/`androidReceiverAppId` and `androidNotificationsEnabled`
     * props only take effect if your provider extends
     * `NitroCastOptionsProvider` (or reads the same meta-data).
     *
     * @default 'com.margelo.nitro.googlecast.NitroCastOptionsProvider'
     */
    androidOptionsProvider?: string

    androidReceiverAppId?: string

    /**
     * Whether to use the default expanded controller. iOS-only effect
     * (`useDefaultExpandedMediaControls`) — on Android the expanded controller
     * is automatic in v5 (registered by the library manifest).
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
     * Skip the AppDelegate `GCKCastContext` init injection entirely, for apps
     * that need fully custom `GCKCastOptions` (E10 escape hatch). Info.plist
     * wiring (Bonjour services, local-network usage description) still
     * applies.
     *
     * @default false
     */
    iosSkipAppDelegateInit?: boolean

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
    skipAppDelegateInit: props.iosSkipAppDelegateInit,
    suspendSessionsWhenBackgrounded: props.iosSuspendSessionsWhenBackgrounded,
    startDiscoveryAfterFirstTapOnCastButton:
      props.iosStartDiscoveryAfterFirstTapOnCastButton,
  })

  config = withAndroidGoogleCast(config, {
    receiverAppId: props.androidReceiverAppId ?? props.receiverAppId,
    notificationsEnabled: props.androidNotificationsEnabled,
    optionsProvider: props.androidOptionsProvider,
    androidPlayServicesCastFrameworkVersion:
      props.androidPlayServicesCastFrameworkVersion,
  })

  return config
}

export default createRunOncePlugin(withGoogleCast, 'react-native-google-cast')

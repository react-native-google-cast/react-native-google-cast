import { mergeContents } from '@expo/config-plugins/build/utils/generateCode'
import {
  ConfigPlugin,
  withAppDelegate,
  withEntitlementsPlist,
  withInfoPlist,
} from '@expo/config-plugins'

/**
 * In Xcode, go to Signing & Capabilities, click + Capability and select Access WiFi Information. (This is required since iOS 12.)
 * Note that "Wireless Accessory Configuration" is unrelated.
 *
 * @param {*} config
 * @returns
 */
const withIosWifiEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config_) => {
    config_.modResults['com.apple.developer.networking.wifi-info'] = true
    return config_
  })
}

const LOCAL_NETWORK_USAGE =
  '${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network'
// const BLUETOOTH_ALWAYS_USAGE =
//   "${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices";
// const BLUETOOTH_PERIPHERAL_USAGE =
//   "${PRODUCT_NAME} uses Bluetooth to discover nearby Cast devices";
// const MICROPHONE_USAGE =
//   "${PRODUCT_NAME} uses microphone access to listen for ultrasonic tokens when pairing with nearby Cast devices";

/**
 * On iOS, a dialog asking the user for the local network permission will now be displayed immediately when the app is opened.
 *
 * @param {*} config
 * @param {*} props.receiverAppId If using a custom receiver, make sure to replace `CC1AD845` with your custom receiver app id.
 * @returns
 */
const withIosLocalNetworkPermissions: ConfigPlugin<{
  receiverAppId?: string
}> = (config, { receiverAppId = 'CC1AD845' } = {}) => {
  return withInfoPlist(config, (config_) => {
    if (!Array.isArray(config_.modResults.NSBonjourServices)) {
      config_.modResults.NSBonjourServices = []
    }
    // Add required values
    config_.modResults.NSBonjourServices.push(
      '_googlecast._tcp',
      `_${receiverAppId}._googlecast._tcp`
    )

    // Remove duplicates
    config_.modResults.NSBonjourServices = [
      ...new Set(config_.modResults.NSBonjourServices),
    ]

    // For iOS 14+, you need to add local network permissions to Info.plist:
    // https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#updating_your_app_on_ios_14
    config_.modResults.NSLocalNetworkUsageDescription =
      config_.modResults.NSLocalNetworkUsageDescription || LOCAL_NETWORK_USAGE
    return config_
  })
}

// const withIosGuestMode: ConfigPlugin = (config) => {
//   return withInfoPlist(config, (config) => {
//     config.modResults.NSBluetoothAlwaysUsageDescription =
//       config.modResults.NSBluetoothAlwaysUsageDescription ||
//       BLUETOOTH_ALWAYS_USAGE;
//     config.modResults.NSBluetoothPeripheralUsageDescription =
//       config.modResults.NSBluetoothPeripheralUsageDescription ||
//       BLUETOOTH_PERIPHERAL_USAGE;
//     config.modResults.NSMicrophoneUsageDescription =
//       config.modResults.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
//     return config;
//   });
// };

// TODO: Use AppDelegate swizzling
const withIosAppDelegateLoaded: ConfigPlugin<IosProps> = (config, props) => {
  return withAppDelegate(config, (config_) => {
    if (!['objc', 'objcpp'].includes(config_.modResults.language)) {
      throw new Error(
        "react-native-google-cast config plugin does not support AppDelegate' that aren't Objective-C(++) yet."
      )
    }
    config_.modResults.contents =
      addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
        config_.modResults.contents,
        props
      ).contents
    config_.modResults.contents = addGoogleCastAppDelegateImport(
      config_.modResults.contents
    ).contents

    return config_
  })
}

export const withIosGoogleCast: ConfigPlugin<{
  /**
   * @default 'CC1AD845'
   */
  receiverAppId?: string
  /**
   * @default true
   */
  suspendSessionsWhenBackgrounded?: boolean
}> = (config, props) => {
  config = withIosWifiEntitlements(config)
  config = withIosLocalNetworkPermissions(config, {
    receiverAppId: props.receiverAppId,
  })
  config = withIosAppDelegateLoaded(config, {
    receiverAppId: props.receiverAppId,
    suspendSessionsWhenBackgrounded: props.suspendSessionsWhenBackgrounded,
    // disableDiscoveryAutostart?: boolean;
    // startDiscoveryAfterFirstTapOnCastButton?: boolean;
  })

  // TODO
  //   config = withIosGuestMode(config)

  return config
}

// From expo-cli RNMaps setup
export const MATCH_INIT =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g

type IosProps = {
  receiverAppId?: string | null
  suspendSessionsWhenBackgrounded?: boolean
  // disableDiscoveryAutostart?: boolean
  startDiscoveryAfterFirstTapOnCastButton?: boolean
}

export function addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
  src: string,
  {
    receiverAppId = null,
    suspendSessionsWhenBackgrounded = true,
    // disableDiscoveryAutostart = false,
    startDiscoveryAfterFirstTapOnCastButton = true,
  }: IosProps = {}
) {
  let newSrc = []
  newSrc.push(
    // For extra safety
    '#if __has_include(<GoogleCast/GoogleCast.h>)',
    // TODO: This should probably read safely from a static file like the Info.plist
    `  NSString *receiverAppID = ${
      receiverAppId
        ? `@"${receiverAppId}"`
        : 'kGCKDefaultMediaReceiverApplicationID'
    };`,
    '  GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:receiverAppID];',
    '  GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];',
    // TODO: Same as above, read statically
    // `  options.disableDiscoveryAutostart = ${String(!!disableDiscoveryAutostart)};`,
    `  options.startDiscoveryAfterFirstTapOnCastButton = ${String(
      !!startDiscoveryAfterFirstTapOnCastButton
    )};`,
    `  options.suspendSessionsWhenBackgrounded = ${String(
      !!suspendSessionsWhenBackgrounded
    )};`,
    '  [GCKCastContext setSharedInstanceWithOptions:options];',
    '#endif'
  )

  newSrc = newSrc.filter(Boolean)

  return mergeContents({
    tag: 'react-native-google-cast-didFinishLaunchingWithOptions',
    src,
    newSrc: newSrc.join('\n'),
    anchor: MATCH_INIT,
    offset: 2,
    comment: '//',
  })
}

function addGoogleCastAppDelegateImport(src: string) {
  const newSrc = []
  newSrc.push(
    '#if __has_include(<GoogleCast/GoogleCast.h>)',
    '#import <GoogleCast/GoogleCast.h>',
    '#endif'
  )

  return mergeContents({
    tag: 'react-native-google-cast-import',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /#import "AppDelegate\.h"/,
    offset: 1,
    comment: '//',
  })
}

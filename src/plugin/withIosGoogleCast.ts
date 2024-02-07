import {
  ConfigPlugin,
  withAppDelegate,
  withInfoPlist,
} from '@expo/config-plugins'
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode'

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
  return withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.NSBonjourServices)) {
      config.modResults.NSBonjourServices = []
    }
    // Add required values
    config.modResults.NSBonjourServices.push(
      '_googlecast._tcp',
      `_${receiverAppId}._googlecast._tcp`
    )

    // Remove duplicates
    config.modResults.NSBonjourServices = [
      ...new Set(config.modResults.NSBonjourServices),
    ]

    // For iOS 14+, you need to add local network permissions to Info.plist:
    // https://developers.google.com/cast/docs/ios_sender/ios_permissions_changes#updating_your_app_on_ios_14
    config.modResults.NSLocalNetworkUsageDescription =
      config.modResults.NSLocalNetworkUsageDescription || LOCAL_NETWORK_USAGE
    return config
  })
}

// const withIosPodfile: ConfigPlugin<> = (config, {}) => {
//   return withPodfileProperties(config, config => {

//   })
// }

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
  return withAppDelegate(config, (config) => {
    if (!['objc', 'objcpp'].includes(config.modResults.language)) {
      throw new Error(
        "react-native-google-cast config plugin does not support AppDelegate' that aren't Objective-C(++) yet."
      )
    }
    config.modResults.contents =
      addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
        config.modResults.contents,
        props
      ).contents
    config.modResults.contents = addGoogleCastAppDelegateImport(
      config.modResults.contents
    ).contents

    return config
  })
}

export const withIosGoogleCast: ConfigPlugin<{
  /**
   * @default 'CC1AD845'
   */
  receiverAppId?: string
  disableDiscoveryAutostart?: boolean
  startDiscoveryAfterFirstTapOnCastButton?: boolean
}> = (config, props) => {
  config = withIosLocalNetworkPermissions(config, props)
  config = withIosAppDelegateLoaded(config, props)

  // TODO
  //   config = withIosGuestMode(config)

  return config
}

// From expo-cli RNMaps setup
export const MATCH_INIT =
  /(?:(self\.|_)(\w+)\s?=\s?\[\[UMModuleRegistryAdapter alloc\])|(?:RCTBridge\s?\*\s?(\w+)\s?=\s?\[\[RCTBridge alloc\])|(\[self\.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions\])/g

type IosProps = {
  receiverAppId?: string | null
  disableDiscoveryAutostart?: boolean
  startDiscoveryAfterFirstTapOnCastButton?: boolean
}

export function addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
  src: string,
  {
    receiverAppId = null,
    disableDiscoveryAutostart = false,
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
    `  options.disableDiscoveryAutostart = ${String(
      !!disableDiscoveryAutostart
    )};`,
    `  options.startDiscoveryAfterFirstTapOnCastButton = ${String(
      !!startDiscoveryAfterFirstTapOnCastButton
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
    offset: 0,
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

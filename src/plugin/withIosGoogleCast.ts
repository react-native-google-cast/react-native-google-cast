import { mergeContents } from '@expo/config-plugins/build/utils/generateCode'
import {
  ConfigPlugin,
  withAppDelegate,
  withInfoPlist,
} from '@expo/config-plugins'
import { insertContentsInsideSwiftFunctionBlock } from '@expo/config-plugins/build/ios/codeMod'
const LOCAL_NETWORK_USAGE =
  '${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network'

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

// TODO: Use AppDelegate swizzling
const withIosAppDelegateLoaded: ConfigPlugin<IosProps> = (config, props) => {
  return withAppDelegate(config, (config_) => {
    if (config_.modResults.language === 'swift') {
      config_.modResults.contents =
        addSwiftGoogleCastAppDelegateDidFinishLaunchingWithOptions(
          config_.modResults.contents,
          props
        )
      config_.modResults.contents = addSwiftGoogleCastAppDelegateImport(
        config_.modResults.contents
      ).contents
    } else if (
      config_.modResults.language === 'objc' ||
      config_.modResults.language === 'objcpp'
    ) {
      config_.modResults.contents =
        addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
          config_.modResults.contents,
          props
        ).contents
      config_.modResults.contents = addGoogleCastAppDelegateImport(
        config_.modResults.contents
      ).contents
    }

    return config_
  })
}

export const withIosGoogleCast: ConfigPlugin<{
  disableDiscoveryAutostart?: boolean
  expandedController?: boolean
  receiverAppId?: string
  startDiscoveryAfterFirstTapOnCastButton?: boolean
  suspendSessionsWhenBackgrounded?: boolean
}> = (config, props) => {
  config = withIosLocalNetworkPermissions(config, {
    receiverAppId: props.receiverAppId,
  })
  config = withIosAppDelegateLoaded(config, {
    disableDiscoveryAutostart: props.disableDiscoveryAutostart,
    expandedController: props.expandedController,
    receiverAppId: props.receiverAppId,
    startDiscoveryAfterFirstTapOnCastButton:
      props.startDiscoveryAfterFirstTapOnCastButton,
    suspendSessionsWhenBackgrounded: props.suspendSessionsWhenBackgrounded,
  })

  return config
}

// From expo-cli RNMaps setup
export const MATCH_INIT =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g

type IosProps = {
  disableDiscoveryAutostart?: boolean
  expandedController?: boolean
  receiverAppId?: string | null
  startDiscoveryAfterFirstTapOnCastButton?: boolean
  suspendSessionsWhenBackgrounded?: boolean
}

export function addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
  src: string,
  {
    disableDiscoveryAutostart = false,
    expandedController = false,
    receiverAppId = null,
    startDiscoveryAfterFirstTapOnCastButton = true,
    suspendSessionsWhenBackgrounded = true,
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
    `  options.disableDiscoveryAutostart = ${String(!!disableDiscoveryAutostart)};`,
    `  options.startDiscoveryAfterFirstTapOnCastButton = ${String(
      !!startDiscoveryAfterFirstTapOnCastButton
    )};`,
    `  options.suspendSessionsWhenBackgrounded = ${String(
      !!suspendSessionsWhenBackgrounded
    )};`,
    '  [GCKCastContext setSharedInstanceWithOptions:options];',
    `  [GCKCastContext sharedInstance].useDefaultExpandedMediaControls = ${String(!!expandedController)};`,
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

function addSwiftGoogleCastAppDelegateImport(src: string) {
  const newSrc = []
  newSrc.push('#if canImport(GoogleCast)', 'import GoogleCast', '#endif')

  return mergeContents({
    tag: 'react-native-google-cast-import',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /import React/,
    offset: 0,
    comment: '//',
  })
}

export function addSwiftGoogleCastAppDelegateDidFinishLaunchingWithOptions(
  src: string,
  {
    disableDiscoveryAutostart = false,
    expandedController = false,
    receiverAppId = null,
    startDiscoveryAfterFirstTapOnCastButton = true,
    suspendSessionsWhenBackgrounded = true,
  }: IosProps = {}
) {
  let newSrc = []
  newSrc.push(
    // For extra safety
    '#if canImport(GoogleCast)',
    `    let receiverAppID = ${
      receiverAppId
        ? `"${receiverAppId}"`
        : 'kGCKDefaultMediaReceiverApplicationID'
    }`,
    '    let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)',
    '    let options = GCKCastOptions(discoveryCriteria: criteria)',
    `    options.disableDiscoveryAutostart = ${String(!!disableDiscoveryAutostart)}`,
    `    options.startDiscoveryAfterFirstTapOnCastButton = ${String(
      !!startDiscoveryAfterFirstTapOnCastButton
    )}`,
    `    options.suspendSessionsWhenBackgrounded = ${String(
      !!suspendSessionsWhenBackgrounded
    )}`,
    '    GCKCastContext.setSharedInstanceWith(options)',
    `    GCKCastContext.sharedInstance().useDefaultExpandedMediaControls = ${String(!!expandedController)}`,
    '#endif'
  )

  newSrc = newSrc.filter(Boolean)

  return insertContentsInsideSwiftFunctionBlock(
    src,
    'application didFinishLaunchingWithOptions:',
    newSrc.join('\n'),
    { position: 'tailBeforeLastReturn' }
  )
}

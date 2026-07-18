import {
  ConfigPlugin,
  withAppDelegate,
  withInfoPlist,
} from '@expo/config-plugins'
import {
  mergeContents,
  removeContents,
} from '@expo/config-plugins/build/utils/generateCode'

const LOCAL_NETWORK_USAGE =
  '${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network'

const SETUP_DOCS_URL =
  'https://react-native-google-cast.github.io/docs/getting-started/setup'

const APP_DELEGATE_TAG =
  'react-native-google-cast-didFinishLaunchingWithOptions'

/** Manual `GCKCastContext` initialization, in either language (contract v). */
const MANUAL_INIT_RE =
  /GCKCastContext[\s.]*(setSharedInstanceWith|sharedInstanceWithOptions)/

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

/**
 * Wraps an anchor-dependent merge so an unrecognized AppDelegate shape
 * surfaces as a clear plugin error naming the expected anchor (contract v)
 * instead of a raw `Failed to match` dump.
 */
function mergeWithDescriptiveAnchorError<T>(merge: () => T, anchor: RegExp): T {
  try {
    return merge()
  } catch (error) {
    if ((error as { code?: string })?.code === 'ERR_NO_MATCH') {
      throw new Error(
        `react-native-google-cast: could not find the injection anchor \`${anchor.source}\` ` +
          'in your AppDelegate — the template shape is not recognized by the Expo config plugin. ' +
          `Initialize GCKCastContext manually following the setup guide (${SETUP_DOCS_URL}) ` +
          'and set the `iosSkipAppDelegateInit` plugin prop to true.'
      )
    }
    throw error
  }
}

/**
 * Applies the AppDelegate mods for one language: the conflict check
 * (contract v / E10), the tagged `didFinishLaunchingWithOptions` block, and
 * the GoogleCast import. Idempotent — a rerun replaces the tagged block,
 * never duplicates it.
 */
export function applyGoogleCastAppDelegate(
  src: string,
  language: 'swift' | 'objc' | 'objcpp' | string,
  props: IosProps = {}
): string {
  // Unknown AppDelegate language — leave untouched (v4 behavior). Checked
  // before the conflict scan: with no injection there is no double-init, so a
  // manual GCKCastContext init in an exotic delegate is not a conflict.
  if (language !== 'swift' && language !== 'objc' && language !== 'objcpp') {
    return src
  }
  // Contract v conflict policy: a manual GCKCastContext init *outside* our
  // tagged block means the app owns initialization — error out loudly rather
  // than injecting a second init (E10 names the escape hatch).
  const withoutOurBlock = removeContents({
    src,
    tag: APP_DELEGATE_TAG,
  }).contents
  if (MANUAL_INIT_RE.test(withoutOurBlock)) {
    throw new Error(
      'react-native-google-cast: your AppDelegate already initializes GCKCastContext ' +
        '(`setSharedInstanceWith` found outside the plugin-managed block). The Expo config ' +
        'plugin owns this initialization — either remove the manual init from your AppDelegate, ' +
        'or set the `iosSkipAppDelegateInit` plugin prop to true to keep your custom ' +
        'GCKCastOptions (the plugin then only configures Info.plist). ' +
        `See ${SETUP_DOCS_URL}.`
    )
  }

  if (language === 'swift') {
    let contents = mergeWithDescriptiveAnchorError(
      () =>
        addSwiftGoogleCastAppDelegateDidFinishLaunchingWithOptions(src, props)
          .contents,
      SWIFT_MATCH_INIT
    )
    contents = mergeWithDescriptiveAnchorError(
      () => addSwiftGoogleCastAppDelegateImport(contents).contents,
      SWIFT_IMPORT_ANCHOR
    )
    return contents
  }
  let contents = mergeWithDescriptiveAnchorError(
    () =>
      addGoogleCastAppDelegateDidFinishLaunchingWithOptions(src, props)
        .contents,
    MATCH_INIT
  )
  contents = mergeWithDescriptiveAnchorError(
    () => addGoogleCastAppDelegateImport(contents).contents,
    OBJC_IMPORT_ANCHOR
  )
  return contents
}

// TODO: Use AppDelegate swizzling
const withIosAppDelegateLoaded: ConfigPlugin<IosProps> = (config, props) => {
  return withAppDelegate(config, (config_) => {
    config_.modResults.contents = applyGoogleCastAppDelegate(
      config_.modResults.contents,
      config_.modResults.language,
      props
    )
    return config_
  })
}

export const withIosGoogleCast: ConfigPlugin<{
  disableDiscoveryAutostart?: boolean
  expandedController?: boolean
  receiverAppId?: string
  /**
   * E10 escape hatch: skip the AppDelegate init injection entirely (for apps
   * with fully custom `GCKCastOptions`). Info.plist wiring still applies.
   *
   * @default false
   */
  skipAppDelegateInit?: boolean
  startDiscoveryAfterFirstTapOnCastButton?: boolean
  suspendSessionsWhenBackgrounded?: boolean
}> = (config, props) => {
  config = withIosLocalNetworkPermissions(config, {
    receiverAppId: props.receiverAppId,
  })
  if (!props.skipAppDelegateInit) {
    config = withIosAppDelegateLoaded(config, {
      disableDiscoveryAutostart: props.disableDiscoveryAutostart,
      expandedController: props.expandedController,
      receiverAppId: props.receiverAppId,
      startDiscoveryAfterFirstTapOnCastButton:
        props.startDiscoveryAfterFirstTapOnCastButton,
      suspendSessionsWhenBackgrounded: props.suspendSessionsWhenBackgrounded,
    })
  }

  return config
}

// From expo-cli RNMaps setup
export const MATCH_INIT =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g

/** RN 0.86 Swift template anchor (contract v). */
export const SWIFT_MATCH_INIT = /let\s+delegate\s*=\s*ReactNativeDelegate\(\)/

// Import anchors — single source for both the merge and its anchor-miss error
// message (a drifting duplicate would make the error name the wrong anchor).
const OBJC_IMPORT_ANCHOR = /#import "AppDelegate\.h"/
const SWIFT_IMPORT_ANCHOR = /import React/

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
    anchor: OBJC_IMPORT_ANCHOR,
    offset: 1,
    comment: '//',
  })
}

function addSwiftGoogleCastAppDelegateImport(src: string) {
  const newSrc = []
  newSrc.push(
    '#if canImport(GoogleCast) && os(iOS)',
    'import GoogleCast',
    '#endif'
  )

  return mergeContents({
    tag: 'react-native-google-cast-import',
    src,
    newSrc: newSrc.join('\n'),
    anchor: SWIFT_IMPORT_ANCHOR,
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
    '#if canImport(GoogleCast) && os(iOS)',
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

  return mergeContents({
    tag: 'react-native-google-cast-didFinishLaunchingWithOptions',
    src,
    newSrc: newSrc.join('\n'),
    anchor: SWIFT_MATCH_INIT,
    offset: 0,
    comment: '//',
  })
}

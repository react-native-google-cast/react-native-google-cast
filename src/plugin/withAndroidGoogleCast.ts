import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withMainActivity,
  withProjectBuildGradle,
} from '@expo/config-plugins'
import {
  mergeContents,
  removeContents,
} from '@expo/config-plugins/build/utils/generateCode'

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest

/** GCK activation key (SDK-owned — unchanged from v4). */
export const META_PROVIDER_CLASS =
  'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME'
/** Receiver app id, read by `NitroCastOptionsProvider` (v5 namespace). */
export const META_RECEIVER_APP_ID =
  'com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID'
/** Media-notification toggle, read by `NitroCastOptionsProvider` (v5). */
export const META_NOTIFICATIONS_ENABLED =
  'com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED'
/** The library `OptionsProvider` written when no override prop is given. */
export const DEFAULT_OPTIONS_PROVIDER =
  'com.margelo.nitro.googlecast.NitroCastOptionsProvider'

// --- v4 plugin residue, actively removed for `--no-clean` upgraders (E6) ---
const V4_META_RECEIVER_APP_ID =
  'com.reactnative.googlecast.RECEIVER_APPLICATION_ID'
const V4_EXPANDED_CONTROLLER_ACTIVITY =
  'com.reactnative.googlecast.RNGCExpandedControllerActivity'
/**
 * The 6.1 docs told users to declare the activity manually; the library
 * manifest now owns it, and a stale app-level declaration (with the old
 * `Theme.AppCompat.NoActionBar` theme) is exactly what triggers the
 * `android:theme` manifest-merger conflict — remove it too.
 */
const STALE_NITRO_EXPANDED_CONTROLLER_ACTIVITY =
  'com.margelo.nitro.googlecast.NitroExpandedControllerActivity'
const V4_MAIN_ACTIVITY_TAG = 'react-native-google-cast-onCreate'
const V4_MAIN_ACTIVITY_IMPORT_RE =
  /^[ \t]*import\s+com\.reactnative\.googlecast\.api\.RNGCCastContext;?[ \t]*\r?\n/gm

type AndroidManifestProps = {
  notificationsEnabled?: boolean
  optionsProvider?: string
  receiverAppId?: string
}

/**
 * Applies the v5 Cast meta-data to the app manifest and removes any v4-plugin
 * residue (E6). Upserts keep the mod idempotent (E4). The v5 plugin adds no
 * `<activity>` — `NitroExpandedControllerActivity` ships in the library
 * manifest.
 */
export function setCastAndroidManifest(
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  { notificationsEnabled, optionsProvider, receiverAppId }: AndroidManifestProps
): AndroidConfig.Manifest.AndroidManifest {
  const mainApplication = getMainApplicationOrThrow(androidManifest)

  // v4 residue removal (E6) — the old provider value under META_PROVIDER_CLASS
  // is replaced by the upsert below.
  removeMetaDataItemFromMainApplication(
    mainApplication,
    V4_META_RECEIVER_APP_ID
  )
  if (Array.isArray(mainApplication.activity)) {
    mainApplication.activity = mainApplication.activity.filter(
      (activity) =>
        activity.$?.['android:name'] !== V4_EXPANDED_CONTROLLER_ACTIVITY &&
        activity.$?.['android:name'] !==
          STALE_NITRO_EXPANDED_CONTROLLER_ACTIVITY
    )
  }

  // v5 emissions.
  addMetaDataItemToMainApplication(
    mainApplication,
    META_PROVIDER_CLASS,
    optionsProvider ?? DEFAULT_OPTIONS_PROVIDER
  )
  if (receiverAppId) {
    addMetaDataItemToMainApplication(
      mainApplication,
      META_RECEIVER_APP_ID,
      receiverAppId
    )
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_RECEIVER_APP_ID)
  }
  if (notificationsEnabled === false) {
    addMetaDataItemToMainApplication(
      mainApplication,
      META_NOTIFICATIONS_ENABLED,
      'false'
    )
  } else {
    removeMetaDataItemFromMainApplication(
      mainApplication,
      META_NOTIFICATIONS_ENABLED
    )
  }

  return androidManifest
}

/**
 * Strips the v4 plugin's MainActivity emissions (E6): the
 * `react-native-google-cast-onCreate` tagged block and the
 * `RNGCCastContext` import. A no-op (byte-identical) on clean templates —
 * the v5 plugin never modifies MainActivity otherwise.
 */
export function removeV4MainActivityResidue(src: string): string {
  const withoutBlock = removeContents({
    src,
    tag: V4_MAIN_ACTIVITY_TAG,
  }).contents
  return withoutBlock.replace(V4_MAIN_ACTIVITY_IMPORT_RE, '')
}

/** Strict `major.minor.patch` parse; anything else (`+`, ranges) → null. */
export function parseCafVersion(
  version: string
): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

const CAF_FLOOR: [number, number, number] = [21, 3, 0]

/**
 * E8: warn (don't throw) when the pinned Cast framework version is below
 * 21.3.0 — versions before that post media notifications from a foreground
 * service, the Android 14+ crash class of #447/#527.
 */
function warnOnCastFrameworkVersionBelowFloor(
  version: string | undefined,
  source = 'androidPlayServicesCastFrameworkVersion'
) {
  if (version == null) return
  const parsed = parseCafVersion(version)
  if (!parsed) return
  const [major, minor, patch] = parsed
  const [fMajor, fMinor, fPatch] = CAF_FLOOR
  const belowFloor =
    major < fMajor ||
    (major === fMajor &&
      (minor < fMinor || (minor === fMinor && patch < fPatch)))
  if (belowFloor) {
    console.warn(
      `react-native-google-cast: ${source} "${version}" is below 21.3.0. ` +
        'Cast framework versions before 21.3.0 post media notifications from a foreground service, ' +
        'which crashes on Android 14+ unless you declare the foreground-service permissions ' +
        '(FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK) yourself — see ' +
        'react-native-google-cast issues #447 and #527. Use 21.3.0 or newer (v5 default) unless you ' +
        'accept that risk.'
    )
  }
}

const withAndroidManifestCast: ConfigPlugin<AndroidManifestProps> = (
  config,
  props
) => {
  return withAndroidManifest(config, async (config_) => {
    config_.modResults = setCastAndroidManifest(config_.modResults, props)
    return config_
  })
}

/** v5 never touches MainActivity except to remove the v4 block (E6). */
const withMainActivityV4Cleanup: ConfigPlugin = (config) => {
  return withMainActivity(config, async (config_) => {
    config_.modResults.contents = removeV4MainActivityResidue(
      config_.modResults.contents
    )
    return config_
  })
}

const withProjectBuildGradleVersion: ConfigPlugin<{ version?: string }> = (
  config,
  { version }
) => {
  return withProjectBuildGradle(config, (config_) => {
    if (config_.modResults.language !== 'groovy')
      throw new Error(
        'react-native-google-cast config plugin does not support Kotlin /build.gradle yet.'
      )
    config_.modResults.contents = addGoogleCastVersionImport(
      config_.modResults.contents,
      {
        version,
      }
    )

    return config_
  })
}

const withAppBuildGradleImport: ConfigPlugin<{ version?: string }> = (
  config,
  { version }
) => {
  return withAppBuildGradle(config, (config_) => {
    if (config_.modResults.language !== 'groovy')
      throw new Error(
        'react-native-google-cast config plugin does not support Kotlin app/build.gradle yet.'
      )
    config_.modResults.contents = addSafeExtGet(config_.modResults.contents)

    config_.modResults.contents = addGoogleCastImport(
      config_.modResults.contents,
      {
        version,
      }
    ).contents

    return config_
  })
}

export const withAndroidGoogleCast: ConfigPlugin<{
  /**
   * @default '+'
   */
  androidPlayServicesCastFrameworkVersion?: string

  /**
   * Meta-data consumed by `NitroCastOptionsProvider` (or subclasses calling
   * `super`); a from-scratch provider ignores it (E7).
   */
  notificationsEnabled?: boolean

  /**
   * FQN written to `OPTIONS_PROVIDER_CLASS_NAME`.
   *
   * @default 'com.margelo.nitro.googlecast.NitroCastOptionsProvider'
   */
  optionsProvider?: string

  /**
   * Meta-data consumed by `NitroCastOptionsProvider` (or subclasses calling
   * `super`); a from-scratch provider ignores it (E7).
   */
  receiverAppId?: string
}> = (config, props) => {
  warnOnCastFrameworkVersionBelowFloor(
    props.androidPlayServicesCastFrameworkVersion
  )

  config = withAndroidManifestCast(config, {
    notificationsEnabled: props.notificationsEnabled,
    optionsProvider: props.optionsProvider,
    receiverAppId: props.receiverAppId,
  })
  config = withMainActivityV4Cleanup(config)

  config = withProjectBuildGradleVersion(config, {
    // gradle dep version
    version: props.androidPlayServicesCastFrameworkVersion ?? '+',
  })
  config = withAppBuildGradleImport(config, {
    // gradle dep version
    version: props.androidPlayServicesCastFrameworkVersion ?? '+',
  })

  return config
}

// Deliberate v4-parity redundancy: the library's android/build.gradle already
// declares play-services-cast-framework itself; this app-level injection only
// pins the version the app resolves (overridable via ext.castFrameworkVersion).
export function addGoogleCastImport(
  src: string,
  { version }: { version?: string } = {}
) {
  const newSrc = []

  newSrc.push(
    `    implementation "com.google.android.gms:play-services-cast-framework:\${safeExtGet('castFrameworkVersion', '${version}')}"`
  )

  return mergeContents({
    tag: 'react-native-google-cast-dependencies',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /dependencies(?:\s+)?\{/,
    offset: 1,
    comment: '//',
  })
}

export function addSafeExtGet(src: string) {
  const tag = 'safeExtGet'

  src = removeContents({ src, tag }).contents

  // If the source already has a safeExtGet method after removing this one, then go with the existing one.
  if (src.match(/def(?:\s+)?safeExtGet\(/)) {
    return src
  }
  // Otherwise add a new one
  const newSrc = []
  newSrc.push(
    'def safeExtGet(prop, fallback) {',
    '  rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback',
    '}'
  )

  return mergeContents({
    tag: 'safeExtGet',
    src,
    newSrc: newSrc.join('\n'),
    // This block can go anywhere in the upper scope
    anchor: /apply plugin/,
    offset: 1,
    comment: '//',
  }).contents
}

export function addGoogleCastVersionImport(
  src: string,
  { version }: { version?: string } = {}
) {
  const tag = 'react-native-google-cast-version-import'

  src = removeContents({ src, tag }).contents

  // If the source already has a castFrameworkVersion set, then do not add it again.
  if (src.match(/castFrameworkVersion\s*=/)) {
    console.warn(
      `react-native-google-cast config plugin: Skipping adding castFrameworkVersion as it already exists in the project build.gradle.`
    )
    // The gradle ext value is what the app actually builds against (it
    // overrides the plugin prop) — apply the CAF floor warning to it too.
    const existing = src.match(/castFrameworkVersion\s*=\s*["']([^"']+)["']/)
    warnOnCastFrameworkVersionBelowFloor(
      existing?.[1],
      'castFrameworkVersion (pre-existing in your project build.gradle)'
    )
    return src
  }

  const newSrc = [`        castFrameworkVersion = "${version}"`]
  const hasExtBlock = src.match(/ext(?:\s+)?\{/)
  const anchor = hasExtBlock ? /ext(?:\s+)?\{/ : /buildscript(?:\s+)?\{/

  if (!hasExtBlock) {
    newSrc.unshift('  ext {')
    newSrc.push('  }')
  }

  return mergeContents({
    tag,
    src,
    newSrc: newSrc.join('\n'),
    anchor,
    offset: 1,
    comment: '//',
  }).contents
}

import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withMainActivity,
  withProjectBuildGradle,
} from '@expo/config-plugins'
import { addImports } from '@expo/config-plugins/build/android/codeMod'
import {
  mergeContents,
  removeContents,
} from '@expo/config-plugins/build/utils/generateCode'

const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } =
  AndroidConfig.Manifest

const META_PROVIDER_CLASS =
  'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME'
const META_RECEIVER_APP_ID =
  'com.reactnative.googlecast.RECEIVER_APPLICATION_ID'

type Props = {
  receiverAppId?: string
}

const CUSTOM_ACTIVITY =
  'com.reactnative.googlecast.RNGCExpandedControllerActivity'

async function ensureCustomActivityAsync({
  mainApplication,
}: {
  mainApplication: AndroidConfig.Manifest.ManifestApplication
}) {
  if (Array.isArray(mainApplication.activity)) {
    // Remove all activities matching the custom name
    mainApplication.activity = mainApplication.activity.filter((activity) => {
      return activity.$?.['android:name'] !== CUSTOM_ACTIVITY
    })
  } else {
    mainApplication.activity = []
  }

  // `<activity android:name="${CUSTOM_ACTIVITY}" />`
  mainApplication.activity.push({
    $: {
      'android:name': CUSTOM_ACTIVITY,
    },
  })
  return mainApplication
}

const withAndroidManifestCast: ConfigPlugin<Props> = (
  config,
  { receiverAppId } = {}
) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults)

    ensureCustomActivityAsync({ mainApplication })

    addMetaDataItemToMainApplication(
      mainApplication,
      META_PROVIDER_CLASS,
      // This is the native Java class
      'com.reactnative.googlecast.GoogleCastOptionsProvider'
    )
    if (receiverAppId) {
      addMetaDataItemToMainApplication(
        mainApplication,
        META_RECEIVER_APP_ID,
        receiverAppId
      )
    }
    return config
  })
}

const withProjectBuildGradleVersion: ConfigPlugin<{ version?: string }> = (
  config,
  { version }
) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy')
      throw new Error(
        'react-native-google-cast config plugin does not support Kotlin /build.gradle yet.'
      )
    config.modResults.contents = addGoogleCastVersionImport(
      config.modResults.contents,
      {
        version,
      }
    ).contents

    return config
  })
}

const withAppBuildGradleImport: ConfigPlugin<{ version?: string }> = (
  config,
  { version }
) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy')
      throw new Error(
        'react-native-google-cast config plugin does not support Kotlin app/build.gradle yet.'
      )
    config.modResults.contents = addSafeExtGet(config.modResults.contents)

    config.modResults.contents = addGoogleCastImport(
      config.modResults.contents,
      {
        version,
      }
    ).contents

    return config
  })
}

const withMainActivityLazyLoading: ConfigPlugin = (config) => {
  return withMainActivity(config, async (config) => {
    const src = addImports(
      config.modResults.contents,
      ['com.google.android.gms.cast.framework.CastContext'],
      config.modResults.language === 'java'
    )
    if (config.modResults.language === 'java') {
      config.modResults.contents = addGoogleCastLazyLoadingImport(src).contents
    } else {
      throw new Error(
        'react-native-google-cast config plugin does not support kotlin MainActivity yet.'
      )
    }
    return config
  })
}

// castFrameworkVersion
export const withAndroidGoogleCast: ConfigPlugin<{
  /**
   * @default '+'
   */
  androidPlayServicesCastFrameworkVersion?: string

  /**
   * ??
   */
  receiverAppId?: string
}> = (config, props) => {
  config = withAndroidManifestCast(config, {
    receiverAppId: props.receiverAppId,
  })
  config = withMainActivityLazyLoading(config)

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

function addGoogleCastLazyLoadingImport(src: string) {
  const newSrc = []
  newSrc.push('    CastContext.getSharedInstance(this);')

  return mergeContents({
    tag: 'react-native-google-cast-onCreate',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /super\.onCreate\(\w+\);/,
    offset: 1,
    comment: '//',
  })
}

// TODO: Add this ability to autolinking
// dependencies { implementation "com.google.android.gms:play-services-cast-framework:+" }
function addGoogleCastImport(
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

function addSafeExtGet(src: string) {
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

function addGoogleCastVersionImport(
  src: string,
  { version }: { version?: string } = {}
) {
  const newSrc = []
  newSrc.push(`        castFrameworkVersion = "${version}"`)

  return mergeContents({
    tag: 'react-native-google-cast-version',
    src,
    newSrc: newSrc.join('\n'),
    anchor: /ext(?:\s+)?\{/,
    offset: 1,
    comment: '//',
  })
}

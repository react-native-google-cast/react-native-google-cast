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

const MAIN_ACTIVITY_LANGUAGES: Record<
  'java' | 'kt',
  { code: string; anchor: RegExp }
> = {
  java: {
    code: 'CastContext.getSharedInstance(this)',
    anchor: /super\.onCreate\(\w+\)/,
  },
  kt: {
    code: 'CastContext.getSharedInstance(this)',
    anchor: /super\.onCreate\(\w+\)/,
  },
}

type Props = {
  expandedController?: boolean
  receiverAppId?: string
}

const EXPANDED_CONTROLLER_ACTIVITY =
  'com.reactnative.googlecast.RNGCExpandedControllerActivity'

async function ensureExpandedControllerActivity({
  mainApplication,
}: {
  mainApplication: AndroidConfig.Manifest.ManifestApplication
}) {
  if (Array.isArray(mainApplication.activity)) {
    // If the expanded controller activity is already added
    mainApplication.activity = mainApplication.activity.filter((activity) => {
      return activity.$?.['android:name'] !== EXPANDED_CONTROLLER_ACTIVITY
    })
  } else {
    mainApplication.activity = []
  }

  // adds `<activity android:name="${EXPANDED_CONTROLLER_ACTIVITY}" />` to the manifest
  mainApplication.activity.push({
    $: {
      'android:name': EXPANDED_CONTROLLER_ACTIVITY,
    },
  })
  return mainApplication
}

const withAndroidManifestCast: ConfigPlugin<Props> = (
  config,
  { expandedController, receiverAppId } = {}
) => {
  return withAndroidManifest(config, async (config_) => {
    const mainApplication = getMainApplicationOrThrow(config_.modResults)

    if (expandedController) {
      ensureExpandedControllerActivity({ mainApplication })
    }

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

const withMainActivityLazyLoading: ConfigPlugin = (config) => {
  return withMainActivity(config, async (config_) => {
    const src = addImports(
      config_.modResults.contents,
      ['com.google.android.gms.cast.framework.CastContext'],
      config_.modResults.language === 'java'
    )

    config_.modResults.contents = addGoogleCastLazyLoadingImport(
      src,
      config_.modResults.language
    ).contents

    return config_
  })
}

export const withAndroidGoogleCast: ConfigPlugin<{
  /**
   * @default '+'
   */
  androidPlayServicesCastFrameworkVersion?: string

  expandedController?: boolean

  /**
   * ??
   */
  receiverAppId?: string
}> = (config, props) => {
  config = withAndroidManifestCast(config, {
    expandedController: props.expandedController,
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

function addGoogleCastLazyLoadingImport(
  src: string,
  language: keyof typeof MAIN_ACTIVITY_LANGUAGES
) {
  const mainActivity = MAIN_ACTIVITY_LANGUAGES[language]
  if (!mainActivity) {
    throw new Error(
      `react-native-google-cast config plugin does not support MainActivity.${language} yet`
    )
  }

  const newSrc = []
  newSrc.push(`    ${mainActivity.code}`)

  return mergeContents({
    tag: 'react-native-google-cast-onCreate',
    src,
    newSrc: newSrc.join('\n'),
    anchor: mainActivity.anchor,
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
  const tag = 'react-native-google-cast-version-import'

  src = removeContents({ src, tag }).contents

  // If the source already has a castFrameworkVersion set, then do not add it again.
  if (src.match(/castFrameworkVersion\s*=/)) {
    console.warn(
      `react-native-google-cast config plugin: Skipping adding castFrameworkVersion as it already exists in the project build.gradle.`
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

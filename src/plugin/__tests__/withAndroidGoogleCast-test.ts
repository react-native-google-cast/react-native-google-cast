import fs from 'fs'
import path from 'path'
import { AndroidConfig } from '@expo/config-plugins'
import type { ExpoConfig } from '@expo/config-types'
import {
  DEFAULT_OPTIONS_PROVIDER,
  META_NOTIFICATIONS_ENABLED,
  META_PROVIDER_CLASS,
  META_RECEIVER_APP_ID,
  addGoogleCastImport,
  addGoogleCastVersionImport,
  addSafeExtGet,
  removeV4MainActivityResidue,
  setCastAndroidManifest,
  withAndroidGoogleCast,
} from '../withAndroidGoogleCast'

const { getMainApplicationOrThrow, readAndroidManifestAsync } =
  AndroidConfig.Manifest

const fixture = (name: string) => path.join(__dirname, 'fixtures', name)

const readFixture = (name: string) => fs.readFileSync(fixture(name), 'utf8')

async function readManifest(name: string) {
  return await readAndroidManifestAsync(fixture(name))
}

function metaDataValue(
  manifest: AndroidConfig.Manifest.AndroidManifest,
  name: string
): string | undefined {
  const mainApplication = getMainApplicationOrThrow(manifest)
  const item = mainApplication['meta-data']?.find(
    (e) => e.$['android:name'] === name
  )
  return item?.$['android:value']
}

describe('setCastAndroidManifest', () => {
  it('emits the v5 options provider by default', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-clean.xml'),
      {}
    )
    expect(metaDataValue(manifest, META_PROVIDER_CLASS)).toBe(
      DEFAULT_OPTIONS_PROVIDER
    )
    expect(DEFAULT_OPTIONS_PROVIDER).toBe(
      'com.margelo.nitro.googlecast.NitroCastOptionsProvider'
    )
  })

  it('lets the androidOptionsProvider prop override the provider class (2A)', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-clean.xml'),
      { optionsProvider: 'com.acme.MyProvider' }
    )
    expect(metaDataValue(manifest, META_PROVIDER_CLASS)).toBe(
      'com.acme.MyProvider'
    )
  })

  it('writes the receiver app id under the v5-namespaced key', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-clean.xml'),
      { receiverAppId: 'ABCD1234' }
    )
    expect(META_RECEIVER_APP_ID).toBe(
      'com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID'
    )
    expect(metaDataValue(manifest, META_RECEIVER_APP_ID)).toBe('ABCD1234')
  })

  it('omits the receiver meta-data when no receiverAppId is given', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-clean.xml'),
      {}
    )
    expect(metaDataValue(manifest, META_RECEIVER_APP_ID)).toBeUndefined()
  })

  it('writes NOTIFICATIONS_ENABLED="false" for androidNotificationsEnabled: false', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-clean.xml'),
      { notificationsEnabled: false }
    )
    expect(META_NOTIFICATIONS_ENABLED).toBe(
      'com.margelo.nitro.googlecast.NOTIFICATIONS_ENABLED'
    )
    expect(metaDataValue(manifest, META_NOTIFICATIONS_ENABLED)).toBe('false')
  })

  it.each([[true], [undefined]])(
    'omits NOTIFICATIONS_ENABLED for androidNotificationsEnabled: %s',
    async (notificationsEnabled) => {
      const manifest = setCastAndroidManifest(
        await readManifest('AndroidManifest-clean.xml'),
        { notificationsEnabled }
      )
      expect(
        metaDataValue(manifest, META_NOTIFICATIONS_ENABLED)
      ).toBeUndefined()
    }
  )

  it('adds no <activity> and no v4 class names on a clean manifest (CRITICAL)', async () => {
    const input = await readManifest('AndroidManifest-clean.xml')
    const inputActivities = JSON.parse(
      JSON.stringify(getMainApplicationOrThrow(input).activity)
    )
    const manifest = setCastAndroidManifest(input, {
      receiverAppId: 'ABCD1234',
    })

    const mainApplication = getMainApplicationOrThrow(manifest)
    expect(mainApplication.activity).toEqual(inputActivities)

    const serialized = JSON.stringify(manifest)
    expect(serialized).not.toContain(
      'com.reactnative.googlecast.GoogleCastOptionsProvider'
    )
    expect(serialized).not.toContain('RNGCExpandedControllerActivity')
    expect(serialized).not.toContain('com.reactnative.googlecast')
  })

  it('removes the v4 plugin residue from a v4-shaped manifest (E6)', async () => {
    const manifest = setCastAndroidManifest(
      await readManifest('AndroidManifest-v4.xml'),
      { receiverAppId: 'ABCD1234' }
    )

    const serialized = JSON.stringify(manifest)
    // old receiver key, old provider value, old activity — all gone
    expect(serialized).not.toContain('com.reactnative.googlecast')
    // the SDK provider key was upserted, not duplicated
    const mainApplication = getMainApplicationOrThrow(manifest)
    const providerItems = mainApplication['meta-data']?.filter(
      (e) => e.$['android:name'] === META_PROVIDER_CLASS
    )
    expect(providerItems).toHaveLength(1)
    expect(providerItems?.[0].$['android:value']).toBe(DEFAULT_OPTIONS_PROVIDER)
    // v5 receiver key written; MainActivity untouched
    expect(metaDataValue(manifest, META_RECEIVER_APP_ID)).toBe('ABCD1234')
    expect(mainApplication.activity?.map((a) => a.$['android:name'])).toEqual([
      '.MainActivity',
    ])
  })

  it('is idempotent — a double run deep-equals the single run (E4)', async () => {
    const props = { receiverAppId: 'ABCD1234', notificationsEnabled: false }
    const once = setCastAndroidManifest(
      await readManifest('AndroidManifest-v4.xml'),
      props
    )
    const twice = setCastAndroidManifest(
      setCastAndroidManifest(
        await readManifest('AndroidManifest-v4.xml'),
        props
      ),
      props
    )
    expect(twice).toEqual(once)
  })
})

describe('removeV4MainActivityResidue', () => {
  it('leaves a clean MainActivity byte-identical (CRITICAL)', () => {
    const src = readFixture('MainActivity-clean.kt')
    expect(removeV4MainActivityResidue(src)).toBe(src)
  })

  it('strips the v4 tagged block and the RNGCCastContext import (E6)', () => {
    const cleaned = removeV4MainActivityResidue(
      readFixture('MainActivity-v4.kt')
    )
    expect(cleaned).not.toContain('react-native-google-cast-onCreate')
    expect(cleaned).not.toContain('RNGCCastContext')
    expect(cleaned).not.toContain(
      'import com.reactnative.googlecast.api.RNGCCastContext'
    )
    // everything else is untouched
    expect(cleaned).toContain('super.onCreate(savedInstanceState)')
    expect(cleaned).toContain('import android.os.Bundle')
    expect(cleaned).toContain('class MainActivity : ReactActivity()')
  })

  it('is idempotent (E4)', () => {
    const once = removeV4MainActivityResidue(readFixture('MainActivity-v4.kt'))
    expect(removeV4MainActivityResidue(once)).toBe(once)
  })
})

describe('gradle emissions (unchanged from v4)', () => {
  it('adds castFrameworkVersion to the project build.gradle ext block', () => {
    const contents = addGoogleCastVersionImport(
      readFixture('project-build.gradle'),
      { version: '22.0.0' }
    )
    expect(contents).toContain('castFrameworkVersion = "22.0.0"')
  })

  it('adds safeExtGet and the cast-framework dependency to the app build.gradle', () => {
    let contents = addSafeExtGet(readFixture('app-build.gradle'))
    contents = addGoogleCastImport(contents, { version: '22.0.0' }).contents
    expect(contents).toContain('def safeExtGet(prop, fallback)')
    expect(contents).toContain(
      `implementation "com.google.android.gms:play-services-cast-framework:\${safeExtGet('castFrameworkVersion', '22.0.0')}"`
    )
  })

  it('keeps gradle blocks single on a double run (E4)', () => {
    const projectOnce = addGoogleCastVersionImport(
      readFixture('project-build.gradle'),
      { version: '22.0.0' }
    )
    const projectTwice = addGoogleCastVersionImport(projectOnce, {
      version: '22.0.0',
    })
    expect(projectTwice).toBe(projectOnce)

    let appOnce = addSafeExtGet(readFixture('app-build.gradle'))
    appOnce = addGoogleCastImport(appOnce, { version: '22.0.0' }).contents
    let appTwice = addSafeExtGet(appOnce)
    appTwice = addGoogleCastImport(appTwice, { version: '22.0.0' }).contents
    expect(appTwice).toBe(appOnce)
    expect(appTwice.match(/play-services-cast-framework/g)).toHaveLength(1)
  })
})

describe('CAF floor warning (E8)', () => {
  const baseConfig = (): ExpoConfig => ({ name: 'test', slug: 'test' })

  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('warns for a parseable version below 21.3.0', () => {
    withAndroidGoogleCast(baseConfig(), {
      androidPlayServicesCastFrameworkVersion: '21.2.0',
    })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const message = warnSpy.mock.calls[0][0] as string
    expect(message).toContain('21.3.0')
    expect(message).toContain('#447')
    expect(message).toContain('#527')
  })

  it.each([['21.3.0'], ['22.1.0'], ['+']])(
    'does not warn for %s',
    (version) => {
      withAndroidGoogleCast(baseConfig(), {
        androidPlayServicesCastFrameworkVersion: version,
      })
      expect(warnSpy).not.toHaveBeenCalled()
    }
  )

  it('does not warn when the version is unset', () => {
    withAndroidGoogleCast(baseConfig(), {})
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

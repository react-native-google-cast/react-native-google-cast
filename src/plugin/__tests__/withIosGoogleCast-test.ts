import fs from 'fs'
import path from 'path'
import type { ExpoConfig } from '@expo/config-types'
import {
  addGoogleCastAppDelegateDidFinishLaunchingWithOptions,
  applyGoogleCastAppDelegate,
  withIosGoogleCast,
} from '../withIosGoogleCast'

const readFixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')

describe(addGoogleCastAppDelegateDidFinishLaunchingWithOptions, () => {
  it(`adds maps import to Expo Modules AppDelegate`, () => {
    const results = addGoogleCastAppDelegateDidFinishLaunchingWithOptions(
      fs.readFileSync(path.join(__dirname, 'AppDelegate.mm'), 'utf8'),
      {
        receiverAppId: 'foobar-bacon',
        suspendSessionsWhenBackgrounded: false,
        startDiscoveryAfterFirstTapOnCastButton: true,
      }
    )
    // matches a static snapshot
    expect(results.contents).toMatchSnapshot()
    expect(results.contents).toMatch(/foobar-bacon/)
    // did add new content
    expect(results.didMerge).toBe(true)
    // didn't remove old content
    expect(results.didClear).toBe(false)
  })

  it(`fails to add to a malformed app delegate`, () => {
    expect(() =>
      addGoogleCastAppDelegateDidFinishLaunchingWithOptions(`foobar`, {})
    ).toThrow(/foobar/)
  })
})

describe('applyGoogleCastAppDelegate (Swift, RN 0.86 template)', () => {
  it('injects the init block before the ReactNativeDelegate anchor and adds the import', () => {
    const contents = applyGoogleCastAppDelegate(
      readFixture('AppDelegate.swift'),
      'swift',
      { receiverAppId: 'foobar-bacon' }
    )
    expect(contents).toMatchSnapshot()
    expect(contents).toMatch(/foobar-bacon/)
    expect(contents).toContain('import GoogleCast')
    expect(contents).toContain('GCKCastContext.setSharedInstanceWith(options)')
    // the tagged block is injected before the RN 0.86 anchor
    expect(
      contents.indexOf('GCKCastContext.setSharedInstanceWith')
    ).toBeLessThan(contents.indexOf('let delegate = ReactNativeDelegate()'))
  })

  it('still works for the objc AppDelegate shape', () => {
    const contents = applyGoogleCastAppDelegate(
      fs.readFileSync(path.join(__dirname, 'AppDelegate.mm'), 'utf8'),
      'objc',
      { receiverAppId: 'foobar-bacon' }
    )
    expect(contents).toMatch(/foobar-bacon/)
    expect(contents).toContain(
      '[GCKCastContext setSharedInstanceWithOptions:options];'
    )
  })

  it('is idempotent — a double run keeps a single tagged block (E4/contract v)', () => {
    const props = { receiverAppId: 'foobar-bacon' }
    const once = applyGoogleCastAppDelegate(
      readFixture('AppDelegate.swift'),
      'swift',
      props
    )
    const twice = applyGoogleCastAppDelegate(once, 'swift', props)
    expect(twice).toBe(once)
    expect(
      twice.match(
        /@generated begin react-native-google-cast-didFinishLaunchingWithOptions/g
      )
    ).toHaveLength(1)
  })

  it('pins the out-of-the-box discovery contract (v5-xr6 / #625): autostart on, first-tap-gated', () => {
    // GCK's defaults are kept deliberately: discovery autostarts with the
    // context but is gated on the first Cast-button tap, so the iOS 14+ local
    // network permission prompt fires in context (not at cold launch). The
    // native transport never force-starts discovery — this injected init is
    // the single place the contract is configured.
    const contents = applyGoogleCastAppDelegate(
      readFixture('AppDelegate.swift'),
      'swift',
      {}
    )
    expect(contents).toContain('options.disableDiscoveryAutostart = false')
    expect(contents).toContain(
      'options.startDiscoveryAfterFirstTapOnCastButton = true'
    )
  })

  it('throws a descriptive conflict error for a manual GCKCastContext init (contract v / E10)', () => {
    expect(() =>
      applyGoogleCastAppDelegate(
        readFixture('AppDelegate-conflict.swift'),
        'swift',
        {}
      )
    ).toThrow(/GCKCastContext[\s\S]*iosSkipAppDelegateInit/)
  })

  it('ignores a commented-out manual init (no false-positive conflict)', () => {
    const commentedOut = readFixture('AppDelegate.swift').replace(
      'let delegate = ReactNativeDelegate()',
      '// GCKCastContext.setSharedInstanceWith(options) — removed for the plugin\n' +
        '    /* GCKCastContext.setSharedInstanceWith(options) */\n' +
        '    let delegate = ReactNativeDelegate()'
    )
    expect(() =>
      applyGoogleCastAppDelegate(commentedOut, 'swift', {})
    ).not.toThrow()
  })

  it('detects the manual-init conflict in objc AppDelegates too', () => {
    const objcWithManualInit = fs
      .readFileSync(path.join(__dirname, 'AppDelegate.mm'), 'utf8')
      .replace(
        'return [super application:application didFinishLaunchingWithOptions:launchOptions];',
        '[GCKCastContext setSharedInstanceWithOptions:options];\n  return [super application:application didFinishLaunchingWithOptions:launchOptions];'
      )
    expect(() =>
      applyGoogleCastAppDelegate(objcWithManualInit, 'objc', {})
    ).toThrow(/iosSkipAppDelegateInit/)
  })

  it('throws a descriptive anchor-miss error on an unrecognized AppDelegate shape (contract v)', () => {
    expect(() => applyGoogleCastAppDelegate('foobar', 'swift', {})).toThrow(
      /anchor[\s\S]*let\\s\+delegate[\s\S]*react-native-google-cast\.github\.io/
    )
    expect(() => applyGoogleCastAppDelegate('foobar', 'objc', {})).toThrow(
      /anchor[\s\S]*didFinishLaunchingWithOptions[\s\S]*react-native-google-cast\.github\.io/
    )
  })
})

describe('withIosGoogleCast — iosSkipAppDelegateInit (E10)', () => {
  const baseConfig = (): ExpoConfig => ({ name: 'test', slug: 'test' })

  it('registers the AppDelegate mod by default', () => {
    const config = withIosGoogleCast(baseConfig(), {}) as ExpoConfig & {
      mods?: { ios?: Record<string, unknown> }
    }
    expect(config.mods?.ios?.appDelegate).toBeDefined()
    expect(config.mods?.ios?.infoPlist).toBeDefined()
  })

  it('skips only the AppDelegate mod when skipAppDelegateInit is true', () => {
    const config = withIosGoogleCast(baseConfig(), {
      skipAppDelegateInit: true,
    }) as ExpoConfig & { mods?: { ios?: Record<string, unknown> } }
    expect(config.mods?.ios?.appDelegate).toBeUndefined()
    // Info.plist wiring still applies
    expect(config.mods?.ios?.infoPlist).toBeDefined()
  })

  it('leaves the AppDelegate byte-identical when skipping', () => {
    // The skip happens at mod-registration time; the apply function itself is
    // never invoked, so the file content can't change. This pins the seam.
    const src = readFixture('AppDelegate-conflict.swift')
    const config = withIosGoogleCast(baseConfig(), {
      skipAppDelegateInit: true,
    }) as ExpoConfig & { mods?: { ios?: Record<string, unknown> } }
    expect(config.mods?.ios?.appDelegate).toBeUndefined()
    // a manually-initialized AppDelegate remains untouched (and un-errored)
    expect(src).toContain('GCKCastContext.setSharedInstanceWith(options)')
  })
})

import type { PlayServicesState } from '../../types/PlayServicesState'

/**
 * `playServicesState` is seeded from the initial snapshot and never mutated, so
 * each case needs a fresh module registry rather than a setter on the fake.
 *
 * **React and the test renderer are required from INSIDE the isolated registry
 * too.** `jest.isolateModules` gives the block its own module instances, so a
 * React imported at file scope would be a *different* React from the one the
 * hook closes over — the renderer would mount with one dispatcher while
 * `useSyncExternalStore` read another, which fails as
 * `Cannot read properties of null`.
 *
 * This exercises the NATIVE implementation (`castSupport.ts`); jest resolves
 * `.ts`, not `.web.ts`. The web half, where availability is genuinely dynamic
 * (`false` until the SDK announces itself), is covered in
 * `transport/__tests__/CastTransport.web.test.ts`.
 */
async function withPlayServices(
  playServicesState: PlayServicesState,
  body: (ctx: {
    hookValue: boolean
    isSupported: boolean
    castState: string
  }) => void
): Promise<void> {
  let mods!: {
    React: typeof import('react')
    TestRenderer: typeof import('react-test-renderer')
    useCastSupported: () => boolean
    CastContext: { isSupported(): boolean; getCastState(): string }
  }
  // Only the *resolution* needs the isolated registry; the module objects it
  // hands back stay usable afterwards, which is what lets the async flush below
  // happen outside the (synchronous) isolateModules callback.
  jest.isolateModules(() => {
    jest.doMock('../../state/castStore.singleton', () => {
      const { CastStore } = require('../../state/CastStore')
      const {
        FakeCastTransport,
      } = require('../../transport/__fakes__/FakeCastTransport')
      const transport = new FakeCastTransport({
        initialSnapshot: { playServicesState },
      })
      return { castStore: new CastStore(transport), castTransport: transport }
    })
    mods = {
      React: require('react'),
      TestRenderer: require('react-test-renderer'),
      useCastSupported: require('../useCastSupported').useCastSupported,
      CastContext: require('../CastContext').CastContext,
    }
  })

  const { React, TestRenderer, useCastSupported, CastContext } = mods
  // The store seeds from `transport.initAndSubscribe()`, which is async — until
  // it settles the snapshot still carries CastStore's own `'success'` default,
  // so reading before this flush would pass for the wrong reason.
  await TestRenderer.act(async () => {})

  let hookValue: boolean | null = null
  function Probe() {
    hookValue = useCastSupported()
    return null
  }
  let renderer!: ReturnType<typeof TestRenderer.create>
  TestRenderer.act(() => {
    renderer = TestRenderer.create(React.createElement(Probe))
  })
  body({
    hookValue: hookValue as unknown as boolean,
    isSupported: CastContext.isSupported(),
    castState: CastContext.getCastState(),
  })
  TestRenderer.act(() => {
    renderer.unmount()
  })
}

describe('useCastSupported / CastContext.isSupported (native)', () => {
  it('is true when Play Services are available', async () => {
    await withPlayServices('success', ({ hookValue, isSupported }) => {
      expect(hookValue).toBe(true)
      expect(isSupported).toBe(true)
    })
  })

  it.each<PlayServicesState>([
    'missing',
    'updating',
    'updateRequired',
    'disabled',
    'invalid',
  ])('is false when Play Services are %s', async (state) => {
    await withPlayServices(state, ({ hookValue, isSupported }) => {
      expect(hookValue).toBe(false)
      expect(isSupported).toBe(false)
    })
  })

  it('is a different question from useCastState — "no devices" is still supported', async () => {
    // The distinction the hook exists for. `noDevicesAvailable` is temporary
    // (no receiver on this network right now); reading it as "this platform
    // cannot cast" would make apps hide their cast UI on every network that
    // happens to have no Chromecast on it.
    await withPlayServices('success', ({ hookValue, castState }) => {
      expect(castState).toBe('noDevicesAvailable')
      expect(hookValue).toBe(true)
    })
  })
})

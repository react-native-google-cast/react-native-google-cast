import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { CastError, Device, SessionInfo } from '../../transport/types'
import { CastStore } from '../../state/CastStore'
import { SessionManager } from '../SessionManager'
import { DiscoveryManager } from '../DiscoveryManager'
import { RemoteMediaClient } from '../RemoteMediaClient'

// `CastSession.getClient()` imports `RemoteMediaClient`, which transitively
// pulls the singleton progress ticker + native `CastTransport` (unloadable under
// jest). Swap the store singleton for a fake-backed one so the module loads;
// these tests drive their own `setup()` store, not this singleton. Mirrors
// `RemoteMediaClient.test.ts` / `mediaHooks.test.ts`.
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: `Device ${id}`,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}
function session(id: string, detail?: Partial<SessionInfo>): SessionInfo {
  return { sessionId: id, device: device(id), ...detail }
}

async function setup(
  options?: ConstructorParameters<typeof FakeCastTransport>[0]
) {
  const transport = new FakeCastTransport(options)
  const store = new CastStore(transport)
  await store.ready
  return {
    transport,
    store,
    sessionManager: new SessionManager(store, transport),
    discoveryManager: new DiscoveryManager(store, transport),
  }
}

describe('SessionManager — getCurrentCastSession', () => {
  it('returns null when there is no session', async () => {
    const { sessionManager } = await setup()
    expect(sessionManager.getCurrentCastSession()).toBeNull()
  })

  it('returns a memoized session (same ref) within a generation', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })

    const a = sessionManager.getCurrentCastSession()
    const b = sessionManager.getCurrentCastSession()
    expect(a).not.toBeNull()
    expect(a).toBe(b)
    expect(a!.id).toBe('s1')
    expect(a!.device.deviceId).toBe('s1')
  })

  it('returns a new instance after the session changes', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const first = sessionManager.getCurrentCastSession()
    transport.emitLifecycle({ type: 'ended' })
    expect(sessionManager.getCurrentCastSession()).toBeNull()
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    const second = sessionManager.getCurrentCastSession()
    expect(second).not.toBe(first)
    expect(second!.id).toBe('s2')
  })
})

describe('SessionManager — mutations', () => {
  it('delegates startSession / endCurrentSession to the transport', async () => {
    const { sessionManager, transport } = await setup()
    await sessionManager.startSession('d1')
    await sessionManager.endCurrentSession(true)
    expect(transport.startSessionCalls).toEqual(['d1'])
    expect(transport.endCurrentSessionCalls).toEqual([true])
  })

  it('endCurrentSession defaults stopCasting to false', async () => {
    const { sessionManager, transport } = await setup()
    await sessionManager.endCurrentSession()
    expect(transport.endCurrentSessionCalls).toEqual([false])
  })

  it('rejects a CastError when the transport rejects', async () => {
    const { sessionManager, transport } = await setup()
    transport.startSessionBehavior = async () => {
      throw { code: 'network', message: 'unreachable' } as CastError
    }
    await expect(sessionManager.startSession('d1')).rejects.toMatchObject({
      code: 'network',
    })
  })
})

describe('SessionManager — lifecycle events (bus, never replayed)', () => {
  it('onSessionStarted hands the live session', async () => {
    const { sessionManager, transport } = await setup()
    const handler = jest.fn()
    sessionManager.onSessionStarted(handler)
    transport.emitLifecycle({ type: 'started', session: session('s1') })

    expect(handler).toHaveBeenCalledTimes(1)
    const [castSession] = handler.mock.calls[0]!
    expect(castSession.id).toBe('s1')
  })

  it('onSessionEnded hands null (session gone) plus the error', async () => {
    const { sessionManager, transport } = await setup()
    const handler = jest.fn()
    sessionManager.onSessionStarted(jest.fn())
    sessionManager.onSessionEnded(handler)
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'ended', error: { code: 'network' } })

    expect(handler).toHaveBeenCalledWith(null, { code: 'network' })
  })

  it('onSessionStartFailed forwards the error', async () => {
    const { sessionManager, transport } = await setup()
    const handler = jest.fn()
    sessionManager.onSessionStartFailed(handler)
    transport.emitLifecycle({ type: 'startFailed', error: { code: 'timeout' } })
    expect(handler).toHaveBeenCalledWith(null, { code: 'timeout' })
  })

  it('remove() unsubscribes', async () => {
    const { sessionManager, transport } = await setup()
    const handler = jest.fn()
    const sub = sessionManager.onSessionStarted(handler)
    sub.remove()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('CastSession — generation guard (Invariant 3)', () => {
  it('is active while current and rejects once stale', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const castSession = sessionManager.getCurrentCastSession()!
    expect(castSession.isActive).toBe(true)
    expect(() => castSession.assertActive()).not.toThrow()

    // Session ends — the retained façade is now stale (use-after-free guard).
    transport.emitLifecycle({ type: 'ended' })
    expect(castSession.isActive).toBe(false)

    expect.assertions(4)
    try {
      castSession.assertActive()
    } catch (error) {
      expect((error as CastError).code).toBe('noSession')
    }
  })

  it('a façade from a prior session is stale after a new one starts', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const stale = sessionManager.getCurrentCastSession()!
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s1') }) // reused id
    expect(stale.isActive).toBe(false)
    expect(sessionManager.getCurrentCastSession()!.isActive).toBe(true)
  })
})

describe('CastSession — device (live read)', () => {
  it('a façade obtained BEFORE a device update sees the fresh device', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const castSession = sessionManager.getCurrentCastSession()!
    expect(castSession.device.friendlyName).toBe('Device s1')

    // Receiver rename mid-session: no lifecycle transition, no new façade —
    // the SAME memoized object must expose the fresh device via the store.
    transport.emitLifecycle({
      type: 'deviceStatusChanged',
      session: {
        ...session('s1'),
        device: { ...device('s1'), friendlyName: 'Bedroom TV' },
      },
    })
    expect(castSession.device.friendlyName).toBe('Bedroom TV')

    // Session identity / generation semantics are untouched by the rename:
    // still the same memoized façade, still active.
    expect(sessionManager.getCurrentCastSession()).toBe(castSession)
    expect(castSession.isActive).toBe(true)
  })

  it('keeps the last-known device once stale (snapshot semantics)', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const castSession = sessionManager.getCurrentCastSession()!
    transport.emitLifecycle({
      type: 'deviceStatusChanged',
      session: {
        ...session('s1'),
        device: { ...device('s1'), friendlyName: 'Bedroom TV' },
      },
    })
    expect(castSession.device.friendlyName).toBe('Bedroom TV')

    // Teardown, then a NEW session on a different device: the stale façade
    // keeps reporting its own last-known device, not the new session's.
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    expect(castSession.isActive).toBe(false)
    expect(castSession.device.friendlyName).toBe('Bedroom TV')
  })
})

describe('CastSession — device detail (Phase 5)', () => {
  const richSession = () =>
    session('s1', {
      deviceVolume: 0.4,
      deviceMuted: true,
      standbyState: 'active',
      activeInputState: 'inactive',
      applicationStatus: 'Ready to cast',
      applicationMetadata: {
        applicationId: 'APP1',
        name: 'Test Receiver',
        images: [],
        namespaces: ['urn:x-cast:com.example'],
      },
    })

  it('serves device detail synchronously from the store slice', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: richSession() })
    const cs = sessionManager.getCurrentCastSession()!
    expect(cs.getVolume()).toBe(0.4)
    expect(cs.isMute()).toBe(true)
    expect(cs.getStandbyState()).toBe('active')
    expect(cs.getActiveInputState()).toBe('inactive')
    expect(cs.getApplicationStatus()).toBe('Ready to cast')
    expect(cs.getApplicationMetadata()?.applicationId).toBe('APP1')
  })

  it('applies defaults when the optional detail fields are absent', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    expect(cs.getVolume()).toBe(0)
    expect(cs.isMute()).toBe(false)
    expect(cs.getStandbyState()).toBe('unknown')
    expect(cs.getActiveInputState()).toBe('unknown')
    expect(cs.getApplicationMetadata()).toBeNull()
    expect(cs.getApplicationStatus()).toBeNull()
  })

  it('reflects a detail-change event without churning the currentSession ref', async () => {
    const { store, sessionManager, transport } = await setup()
    transport.emitLifecycle({
      type: 'started',
      session: session('s1', { deviceVolume: 0.2 }),
    })
    const cs = sessionManager.getCurrentCastSession()!
    const snapBefore = store.getSnapshot().currentSession
    transport.emitLifecycle({
      type: 'deviceStatusChanged',
      session: session('s1', { deviceVolume: 0.9, deviceMuted: true }),
    })
    expect(cs.getVolume()).toBe(0.9)
    expect(cs.isMute()).toBe(true)
    // currentSession ref preserved → useCastSession does not re-render.
    expect(store.getSnapshot().currentSession).toBe(snapBefore)
  })

  it('setVolume/setMute route to the DEVICE surface, never the media stream', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    await cs.setVolume(0.7)
    await cs.setMute(true)
    expect(transport.setDeviceVolumeCalls).toEqual([0.7])
    expect(transport.setDeviceMutedCalls).toEqual([true])
    const media = transport.mediaCalls.map((c) => c.method)
    expect(media).not.toContain('setStreamVolume')
    expect(media).not.toContain('setStreamMuted')
  })

  it('detail reads throw and mutations reject once the handle is stale', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    transport.emitLifecycle({ type: 'ended' })
    expect(() => cs.getVolume()).toThrow()
    await expect(cs.setVolume(0.5)).rejects.toMatchObject({ code: 'noSession' })
    expect(transport.setDeviceVolumeCalls).toEqual([])
  })
})

describe('CastSession — getClient (Phase 5)', () => {
  it('returns a memoized RemoteMediaClient for the live session', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    const client = cs.getClient()
    expect(client).toBeInstanceOf(RemoteMediaClient)
    expect(cs.getClient()).toBe(client) // same ref within a generation
  })

  it('client mutations route through the transport', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const client = sessionManager.getCurrentCastSession()!.getClient()!
    await client.play()
    expect(transport.mediaCalls.map((c) => c.method)).toContain('play')
  })

  it('throws noSession on a stale handle', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    transport.emitLifecycle({ type: 'ended' })
    expect(() => cs.getClient()).toThrow()
  })
})

describe('CastSession — detail change listeners (Phase 5)', () => {
  it('onStandbyStateChanged fires with the new state and stops after remove()', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    const handler = jest.fn()
    const sub = cs.onStandbyStateChanged(handler)
    transport.emitLifecycle({
      type: 'standbyStateChanged',
      session: session('s1', { standbyState: 'active' }),
    })
    expect(handler).toHaveBeenCalledWith('active')
    sub.remove()
    transport.emitLifecycle({
      type: 'standbyStateChanged',
      session: session('s1', { standbyState: 'inactive' }),
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('onActiveInputStateChanged fires with the new state', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    const handler = jest.fn()
    cs.onActiveInputStateChanged(handler)
    transport.emitLifecycle({
      type: 'activeInputStateChanged',
      session: session('s1', { activeInputState: 'active' }),
    })
    expect(handler).toHaveBeenCalledWith('active')
  })

  it('a listener on a now-stale handle does not fire for a later session', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    const handler = jest.fn()
    cs.onStandbyStateChanged(handler)
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    transport.emitLifecycle({
      type: 'standbyStateChanged',
      session: session('s2', { standbyState: 'active' }),
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('subscribing on an already-stale handle throws noSession', async () => {
    const { sessionManager, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const cs = sessionManager.getCurrentCastSession()!
    transport.emitLifecycle({ type: 'ended' })
    expect(() => cs.onStandbyStateChanged(jest.fn())).toThrow()
  })
})

describe('DiscoveryManager', () => {
  it('getDevices reflects the store snapshot (frozen)', async () => {
    const { discoveryManager, transport } = await setup({
      initialSnapshot: { devices: [device('a')] },
    })
    expect(discoveryManager.getDevices().map((d) => d.deviceId)).toEqual(['a'])
    expect(Object.isFrozen(discoveryManager.getDevices())).toBe(true)

    transport.emitDevices([device('a'), device('b')])
    expect(discoveryManager.getDevices()).toHaveLength(2)
  })

  it('onDevicesUpdated fires only on device changes, not cast-state changes', async () => {
    const { discoveryManager, transport } = await setup()
    const handler = jest.fn()
    discoveryManager.onDevicesUpdated(handler)

    transport.emitState('connecting') // unrelated — must not fire
    expect(handler).not.toHaveBeenCalled()

    transport.emitDevices([device('a')])
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0]![0]).toHaveLength(1)
  })

  it('discovery controls drive the transport', async () => {
    const { discoveryManager, transport } = await setup()
    expect(discoveryManager.isRunning()).toBe(false)
    discoveryManager.startDiscovery()
    expect(transport.isDiscovering).toBe(true)
    expect(discoveryManager.isRunning()).toBe(true)
    discoveryManager.stopDiscovery()
    expect(discoveryManager.isRunning()).toBe(false)

    expect(discoveryManager.isPassiveScan()).toBe(false)
    discoveryManager.setPassiveScan(true)
    expect(discoveryManager.isPassiveScan()).toBe(true)
  })
})

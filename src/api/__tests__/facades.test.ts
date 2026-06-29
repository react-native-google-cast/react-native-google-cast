import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { CastError, Device, SessionInfo } from '../../transport/types'
import { CastStore } from '../../state/CastStore'
import { SessionManager } from '../SessionManager'
import { DiscoveryManager } from '../DiscoveryManager'

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
function session(id: string): SessionInfo {
  return { sessionId: id, device: device(id) }
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

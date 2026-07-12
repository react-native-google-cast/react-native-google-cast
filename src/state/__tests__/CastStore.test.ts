import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import type { Slice } from '../slice'
import { CastStore } from '../CastStore'
import { CHANNEL_SLICE_KEY, type ChannelState } from '../channel.slice'

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

async function makeStore(
  transport: FakeCastTransport = new FakeCastTransport(),
  options?: ConstructorParameters<typeof CastStore>[1]
): Promise<{ store: CastStore; transport: FakeCastTransport }> {
  const store = new CastStore(transport, options)
  await store.ready
  return { store, transport }
}

describe('CastStore — init & seeding', () => {
  it('calls initAndSubscribe exactly once and seeds from the snapshot', async () => {
    const transport = new FakeCastTransport({
      initialSnapshot: {
        castState: 'notConnected',
        devices: [device('a')],
      },
    })
    const { store } = await makeStore(transport)

    expect(transport.initCount).toBe(1)
    const snap = store.getSnapshot()
    expect(snap.castState).toBe('notConnected')
    expect(snap.devices).toHaveLength(1)
    expect(snap.devices[0]!.deviceId).toBe('a')
    expect(snap.currentSession).toBeNull()
  })

  it('cold-start already-casting seeds a session at generation 1', async () => {
    const transport = new FakeCastTransport({
      initialSnapshot: {
        castState: 'connected',
        currentSession: session('s0'),
      },
    })
    const { store } = await makeStore(transport)

    expect(store.getSnapshot().currentSession).toMatchObject({
      sessionId: 's0',
      generation: 1,
    })
    expect(store.getCurrentGeneration()).toBe(1)
  })

  it('unavailable transport: seeds safe defaults but still surfaces playServicesState', async () => {
    const transport = new FakeCastTransport({
      isAvailable: false,
      initialSnapshot: {
        castState: 'noDevicesAvailable',
        playServicesState: 'updateRequired',
      },
    })
    const { store } = await makeStore(transport)

    const snap = store.getSnapshot()
    expect(snap.castState).toBe('noDevicesAvailable')
    expect(snap.playServicesState).toBe('updateRequired')
    expect(snap.devices).toEqual([])
    expect(snap.currentSession).toBeNull()
  })

  it('survives a transport init rejection by staying on safe defaults', async () => {
    const transport = new FakeCastTransport()
    transport.initAndSubscribe = async () => {
      throw new Error('boom')
    }
    const store = new CastStore(transport)
    await expect(store.ready).resolves.toBeUndefined()
    expect(store.getSnapshot().castState).toBe('noDevicesAvailable')
  })
})

describe('CastStore — state fan-out & replay', () => {
  it('notifies subscribers and updates the snapshot on a state change', async () => {
    const { store, transport } = await makeStore()
    const listener = jest.fn()
    store.subscribe(listener)

    transport.emitState('connecting')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().castState).toBe('connecting')
  })

  it('replays current STATE to a late subscriber via getSnapshot', async () => {
    const { store, transport } = await makeStore()
    transport.emitState('connected')

    // A subscriber that joins late still reads the latest state immediately.
    const lateListener = jest.fn()
    store.subscribe(lateListener)
    expect(lateListener).not.toHaveBeenCalled() // subscribe never replays eagerly
    expect(store.getSnapshot().castState).toBe('connected')
  })

  it('stops notifying after unsubscribe (React fan-out ref-counting)', async () => {
    const { store, transport } = await makeStore()
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)

    transport.emitState('connecting')
    unsubscribe()
    transport.emitState('connected')

    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('CastStore — referential stability (no useSyncExternalStore loop)', () => {
  it('returns the same snapshot reference between calls', async () => {
    const { store } = await makeStore()
    expect(store.getSnapshot()).toBe(store.getSnapshot())
  })

  it('does NOT notify or change the reference on a no-op event', async () => {
    const transport = new FakeCastTransport({
      initialSnapshot: { castState: 'connecting' },
    })
    const { store } = await makeStore(transport)
    const before = store.getSnapshot()
    const listener = jest.fn()
    store.subscribe(listener)

    transport.emitState('connecting') // same value → no change

    expect(listener).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toBe(before)
  })

  it('changes the reference only when a value actually changes', async () => {
    const { store, transport } = await makeStore()
    const before = store.getSnapshot()
    transport.emitState('connecting')
    expect(store.getSnapshot()).not.toBe(before)
  })

  it('freezes the snapshot and the devices array', async () => {
    const transport = new FakeCastTransport({
      initialSnapshot: { devices: [device('a')] },
    })
    const { store } = await makeStore(transport)
    const snap = store.getSnapshot()

    expect(Object.isFrozen(snap)).toBe(true)
    expect(Object.isFrozen(snap.devices)).toBe(true)
    expect(() => (snap.devices as Device[]).push(device('b'))).toThrow()
  })
})

describe('CastStore — session lifecycle reducer', () => {
  it('established → torn down transitions with generation bumps', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    expect(store.getSnapshot().currentSession).toMatchObject({
      sessionId: 's1',
      generation: 1,
    })
    expect(store.getCurrentGeneration()).toBe(1)

    transport.emitLifecycle({ type: 'ended' })
    expect(store.getSnapshot().currentSession).toBeNull()
    expect(store.getCurrentGeneration()).toBe(2)
  })

  it('startFailed clears any pending session and bumps generation only if live', async () => {
    const { store, transport } = await makeStore()
    // No live session yet: startFailed is not a real transition.
    transport.emitLifecycle({ type: 'startFailed', error: { code: 'network' } })
    expect(store.getCurrentGeneration()).toBe(0)
    expect(store.getSnapshot().currentSession).toBeNull()
  })

  it('handles the Android resumeFailed path without retaining a dead session', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'suspended', reason: 'appBackgrounded' })
    expect(store.getSnapshot().currentSession).toBeNull()
    expect(store.getCurrentGeneration()).toBe(2)

    transport.emitLifecycle({ type: 'resuming', sessionId: 's1' })
    // resuming is transient — still no live session, no generation change.
    expect(store.getSnapshot().currentSession).toBeNull()
    expect(store.getCurrentGeneration()).toBe(2)

    transport.emitLifecycle({
      type: 'resumeFailed',
      error: { code: 'timeout' },
    })
    expect(store.getSnapshot().currentSession).toBeNull()
    // resumeFailed when no live session is not a transition.
    expect(store.getCurrentGeneration()).toBe(2)
  })

  it('resume after suspend re-establishes a fresh generation', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'suspended' })
    transport.emitLifecycle({ type: 'resumed', session: session('s1') })

    expect(store.getSnapshot().currentSession).toMatchObject({ generation: 3 })
    expect(store.getCurrentGeneration()).toBe(3)
  })

  it('transient starting/ending do not change session presence', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'starting', deviceId: 'd1' })
    expect(store.getSnapshot().currentSession).toBeNull()
    expect(store.getCurrentGeneration()).toBe(0)

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'ending', session: session('s1') })
    // ending: still live until 'ended'.
    expect(store.getSnapshot().currentSession).toMatchObject({
      sessionId: 's1',
    })
    expect(store.getCurrentGeneration()).toBe(1)
  })

  it('connect → disconnect → reconnect yields a fresh session each time', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })

    expect(store.getSnapshot().currentSession).toMatchObject({
      sessionId: 's2',
      generation: 3,
    })
  })
})

describe('CastStore — generation identity (Invariant 3)', () => {
  it('rapid start → end → start produces three distinct generations', async () => {
    const { store, transport } = await makeStore()
    const gens: number[] = []
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    gens.push(store.getCurrentGeneration())
    transport.emitLifecycle({ type: 'ended' })
    gens.push(store.getCurrentGeneration())
    transport.emitLifecycle({ type: 'started', session: session('s1') }) // SAME id
    gens.push(store.getCurrentGeneration())

    expect(gens).toEqual([1, 2, 3]) // distinct despite a reused sessionId
  })

  it('a captured generation goes stale once the session ends', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const capturedGeneration = store.getCurrentGeneration()
    expect(capturedGeneration).toBe(store.getCurrentGeneration()) // valid now

    transport.emitLifecycle({ type: 'ended' })
    // This is exactly the comparison the CastSession façade makes pre-bridge.
    expect(capturedGeneration).not.toBe(store.getCurrentGeneration())
  })
})

describe('CastStore — lifecycle event bus', () => {
  it('delivers events to typed handlers and never replays', async () => {
    const { store, transport } = await makeStore()

    // Event fired BEFORE subscribing must not be replayed.
    transport.emitLifecycle({ type: 'started', session: session('s1') })

    const onStarted = jest.fn()
    store.on('started', onStarted)
    expect(onStarted).not.toHaveBeenCalled()

    transport.emitLifecycle({ type: 'started', session: session('s2') })
    expect(onStarted).toHaveBeenCalledTimes(1)
    expect(onStarted).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'started' })
    )
  })

  it('fires the bus for transient events that do not change state', async () => {
    const { store, transport } = await makeStore()
    const onStarting = jest.fn()
    store.on('starting', onStarting)

    transport.emitLifecycle({ type: 'starting', deviceId: 'd1' })
    expect(onStarting).toHaveBeenCalledTimes(1)
  })

  it('bus handlers observe up-to-date state', async () => {
    const { store, transport } = await makeStore()
    let observed: string | null = null
    store.on('started', () => {
      observed = store.getSnapshot().currentSession?.sessionId ?? null
    })
    transport.emitLifecycle({ type: 'started', session: session('s9') })
    expect(observed).toBe('s9')
  })

  it('unsubscribing a bus handler stops delivery', async () => {
    const { store, transport } = await makeStore()
    const handler = jest.fn()
    const off = store.on('ended', handler)
    off()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitLifecycle({ type: 'ended' })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('CastStore — slice registry', () => {
  it('a registered domain slice reduces its events independently', async () => {
    interface CounterState {
      readonly count: number
    }
    const counterSlice: Slice<CounterState> = {
      key: 'counter',
      seed: () => ({ count: 0 }),
      reduce: (state, event) =>
        event.kind === 'state' ? { count: state.count + 1 } : state,
    }

    const transport = new FakeCastTransport()
    const store = new CastStore(transport, { slices: [counterSlice] })
    await store.ready

    expect(store.getSliceState<CounterState>('counter').count).toBe(0)
    transport.emitState('connecting')
    transport.emitState('connected')
    expect(store.getSliceState<CounterState>('counter').count).toBe(2)
  })

  it('registerSlice throws after init', async () => {
    const { store } = await makeStore()
    expect(() =>
      store.registerSlice({ key: 'late', seed: () => 0, reduce: (s) => s })
    ).toThrow(/before init/)
  })
})

describe('channel message bus (P5.2 — transient, never replayed)', () => {
  const NS = 'urn:x-cast:com.example.a'
  const NS_B = 'urn:x-cast:com.example.b'

  it('routes onChannelMessage by namespace', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const a = jest.fn()
    const b = jest.fn()
    store.onChannelMessage(NS, a)
    store.onChannelMessage(NS_B, b)
    transport.emitChannelMessage(NS, 'hello')
    expect(a).toHaveBeenCalledWith('hello')
    expect(b).not.toHaveBeenCalled()
  })

  it('never replays messages to a late subscriber', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    transport.emitChannelMessage(NS, 'early')
    const late = jest.fn()
    store.onChannelMessage(NS, late)
    expect(late).not.toHaveBeenCalled()
    transport.emitChannelMessage(NS, 'now')
    expect(late).toHaveBeenCalledTimes(1)
    expect(late).toHaveBeenCalledWith('now')
  })

  it('a message is not state: no snapshot rebuild, no subscriber notify', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const listener = jest.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    transport.emitChannelMessage(NS, 'transient')
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
  })

  it('onChannelStatus dispatches into the channel slice', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    transport.emitLifecycle({
      type: 'started',
      session: { sessionId: 's1', device: device('d1') },
    })
    transport.emitChannelStatus(NS, true, false)
    const state = store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY)
    expect(state.statuses[NS]).toEqual({ connected: true, writable: false })
  })

  it('dispose drops message handlers', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const handler = jest.fn()
    store.onChannelMessage(NS, handler)
    store.dispose()
    transport.emitChannelMessage(NS, 'late')
    expect(handler).not.toHaveBeenCalled()
    // subscribing after dispose is a no-op unsubscribe, like on()
    expect(typeof store.onChannelMessage(NS, jest.fn())).toBe('function')
  })
})

describe('CastStore — disposal', () => {
  it('disposes the transport and ignores further events', async () => {
    const { store, transport } = await makeStore()
    const listener = jest.fn()
    store.subscribe(listener)

    store.dispose()
    expect(transport.disposed).toBe(true)

    transport.emitState('connecting')
    expect(listener).not.toHaveBeenCalled()
    expect(store.on('started', jest.fn())).toBeInstanceOf(Function)
  })
})

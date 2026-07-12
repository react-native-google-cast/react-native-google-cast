import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import { CastStore } from '../../state/CastStore'
import { SessionManager } from '../SessionManager'

// CastSession → RemoteMediaClient transitively pulls the native singleton;
// swap it for a fake-backed one (same pattern as facades.test.ts).
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

const NS = 'urn:x-cast:com.example.a'
const NS_B = 'urn:x-cast:com.example.b'

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

async function setup() {
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  await store.ready
  transport.emitLifecycle({ type: 'started', session: session('s1') })
  const sessionManager = new SessionManager(store, transport)
  const castSession = sessionManager.getCurrentCastSession()!
  return { transport, store, sessionManager, castSession }
}

describe('CastSession.addChannel — validation', () => {
  it('rejects a namespace without the urn:x-cast: prefix', async () => {
    const { castSession, transport } = await setup()
    await expect(castSession.addChannel('com.example.a')).rejects.toMatchObject(
      { code: 'invalidParameter' }
    )
    expect(transport.addChannelCalls).toEqual([])
  })

  it('rejects the reserved media namespace', async () => {
    const { castSession } = await setup()
    await expect(
      castSession.addChannel('urn:x-cast:com.google.cast.media')
    ).rejects.toMatchObject({ code: 'invalidParameter' })
  })

  it('rejects a duplicate namespace with alreadyRegistered (T1)', async () => {
    const { castSession, transport } = await setup()
    await castSession.addChannel(NS)
    await expect(castSession.addChannel(NS)).rejects.toMatchObject({
      code: 'alreadyRegistered',
    })
    expect(transport.addChannelCalls).toEqual([NS]) // second never hit the bridge
  })

  it('rejects noSession when the session is stale', async () => {
    const { castSession, transport } = await setup()
    transport.emitLifecycle({ type: 'ended' })
    await expect(castSession.addChannel(NS)).rejects.toMatchObject({
      code: 'noSession',
    })
  })
})

describe('CastSession.addChannel — creation (A2)', () => {
  it('resolves a channel with populated connected/writable', async () => {
    const { castSession } = await setup()
    const channel = await castSession.addChannel(NS)
    expect(channel.namespace).toBe(NS)
    expect(channel.connected).toBe(true)
    expect(channel.writable).toBe(true)
  })

  it('warns when the initial status is not connected (iOS shape)', async () => {
    const { castSession, transport } = await setup()
    transport.addChannelBehavior = async (ns) => {
      transport.emitChannelStatus(ns, false, false)
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const channel = await castSession.addChannel(NS)
    expect(channel.connected).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain(NS)
    warn.mockRestore()
  })

  it('does not warn when connected', async () => {
    const { castSession } = await setup()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await castSession.addChannel(NS)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('CastChannel — messages', () => {
  it('routes inbound messages by namespace to the single listener', async () => {
    const { castSession, transport } = await setup()
    const onA = jest.fn()
    const channelA = await castSession.addChannel(NS, onA)
    await castSession.addChannel(NS_B, jest.fn())
    transport.emitChannelMessage(NS, '{"hello":"world"}')
    expect(onA).toHaveBeenCalledWith('{"hello":"world"}')
    transport.emitChannelMessage(NS_B, 'other')
    expect(onA).toHaveBeenCalledTimes(1)
    void channelA
  })

  it('onMessage replaces the previous listener; offMessage clears it', async () => {
    const { castSession, transport } = await setup()
    const first = jest.fn()
    const second = jest.fn()
    const channel = await castSession.addChannel(NS, first)
    channel.onMessage(second)
    transport.emitChannelMessage(NS, 'm1')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('m1')
    channel.offMessage()
    transport.emitChannelMessage(NS, 'm2')
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('sendMessage stringifies objects and passes strings through (v4)', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    await channel.sendMessage({ hello: 'world' })
    await channel.sendMessage('raw')
    expect(transport.sendMessageCalls).toEqual([
      { namespace: NS, message: '{"hello":"world"}' },
      { namespace: NS, message: 'raw' },
    ])
  })
})

describe('CastChannel — lifecycle (Invariant 3)', () => {
  it('sendMessage/remove reject noSession on a stale channel, before the bridge', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    await expect(channel.sendMessage('x')).rejects.toMatchObject({
      code: 'noSession',
    })
    await expect(channel.remove()).rejects.toMatchObject({ code: 'noSession' })
    expect(transport.sendMessageCalls).toEqual([])
    expect(transport.removeChannelCalls).toEqual([])
  })

  it('connected/writable read undefined once stale (slice cleared / gated)', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    expect(channel.connected).toBeUndefined()
    expect(channel.writable).toBeUndefined()
  })

  it('a stale channel never delivers a later session’s messages, even for the same namespace', async () => {
    const { castSession, transport, sessionManager } = await setup()
    const staleListener = jest.fn()
    await castSession.addChannel(NS, staleListener)
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    // The new session re-registers the same namespace.
    const fresh = sessionManager.getCurrentCastSession()!
    const freshListener = jest.fn()
    await fresh.addChannel(NS, freshListener)
    transport.emitChannelMessage(NS, 'for-s2')
    expect(staleListener).not.toHaveBeenCalled()
    expect(freshListener).toHaveBeenCalledWith('for-s2')
  })

  it('remove() unregisters, frees the namespace, and drops the listener', async () => {
    const { castSession, transport, store } = await setup()
    const listener = jest.fn()
    const channel = await castSession.addChannel(NS, listener)
    await channel.remove()
    expect(transport.removeChannelCalls).toEqual([NS])
    transport.emitChannelMessage(NS, 'after-remove')
    expect(listener).not.toHaveBeenCalled()
    // channelRemoved freed the namespace → re-add succeeds (T1 bookkeeping).
    await expect(castSession.addChannel(NS)).resolves.toBeDefined()
    void store
  })

  it('teardown clears the slice so the namespace is re-addable in a new session', async () => {
    const { castSession, transport, sessionManager } = await setup()
    await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    const fresh = sessionManager.getCurrentCastSession()!
    await expect(fresh.addChannel(NS)).resolves.toBeDefined()
  })

  it('addChannel racing a session REPLACE undoes the registration and rejects noSession', async () => {
    const { castSession, transport, sessionManager } = await setup()
    transport.addChannelBehavior = async (ns) => {
      // The session is replaced while the native registration is in flight;
      // native (Invariant 1) registers on the NEW session and emits its
      // initial status there — the slice (live for s2) records the entry.
      transport.emitLifecycle({ type: 'ended' })
      transport.emitLifecycle({ type: 'started', session: session('s2') })
      transport.emitChannelStatus(ns, true, true)
    }
    await expect(castSession.addChannel(NS)).rejects.toMatchObject({
      code: 'noSession',
    })
    // The undo freed BOTH sides — otherwise the live session's namespace
    // would be poisoned (its own addChannel would reject alreadyRegistered
    // forever, and the stale façade could never remove it).
    expect(transport.removeChannelCalls).toEqual([NS])
    transport.addChannelBehavior = async (ns) => {
      transport.emitChannelStatus(ns, true, true)
    }
    const fresh = sessionManager.getCurrentCastSession()!
    await expect(fresh.addChannel(NS)).resolves.toBeDefined()
  })
})

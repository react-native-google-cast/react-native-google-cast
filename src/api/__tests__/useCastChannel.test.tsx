import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { Device, SessionInfo } from '../../transport/types'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import type { CastChannel } from '../CastChannel'
import { CastContext } from '../CastContext'
import { CastSession } from '../CastSession'
import { useCastChannel } from '../useCastChannel'

jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

const transport = castTransport as unknown as FakeCastTransport
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

let latest: CastChannel | null = null
function Probe({
  namespace,
  onMessage,
}: {
  namespace: string
  onMessage?: (message: string) => void
}) {
  latest = useCastChannel(namespace, onMessage)
  return null
}

/** Flush effects + the addChannel/remove promise chains. */
async function flush() {
  await act(async () => {})
}

/** Mount inside act() so the initial render/effects are properly flushed. */
function createProbe(
  element: React.ReactElement
): TestRenderer.ReactTestRenderer {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

beforeEach(async () => {
  latest = null
  transport.addChannelCalls.length = 0
  transport.removeChannelCalls.length = 0
  await flush()
})

afterEach(() => {
  // Restore default scriptable behaviours mutated by the race tests.
  transport.addChannelBehavior = async (namespace) => {
    transport.emitChannelStatus(namespace, true, true)
  }
  transport.removeChannelBehavior = async () => {}
})

afterEach(() => {
  act(() => {
    transport.emitLifecycle({ type: 'ended' })
  })
})

describe('useCastChannel', () => {
  it('is null with no session and adds the channel once one is live', async () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    await flush()
    expect(latest).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(transport.addChannelCalls).toEqual([NS])
    expect(latest).not.toBeNull()
    expect(latest!.namespace).toBe(NS)
    expect(latest!.connected).toBe(true)
    act(() => renderer.unmount())
  })

  it('wires onMessage through the hook', async () => {
    const onMessage = jest.fn()
    const renderer = createProbe(<Probe namespace={NS} onMessage={onMessage} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => {
      transport.emitChannelMessage(NS, 'hi')
    })
    expect(onMessage).toHaveBeenCalledWith('hi')
    act(() => renderer.unmount())
  })

  it('installs the listener at addChannel time and forwards to the LATEST onMessage', async () => {
    // The forwarder is passed INTO addChannel (wired before the channel is
    // exposed), so an initial receiver message can't be dropped in the gap a
    // separate post-render wiring effect would leave.
    const spy = jest.spyOn(CastSession.prototype, 'addChannel')
    const first = jest.fn()
    const renderer = createProbe(<Probe namespace={NS} onMessage={first} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(spy).toHaveBeenCalledWith(NS, expect.any(Function))

    // Handler identity change: no re-registration, forwarder reads the ref.
    const second = jest.fn()
    act(() => {
      renderer.update(<Probe namespace={NS} onMessage={second} />)
    })
    await flush()
    expect(transport.addChannelCalls).toEqual([NS]) // still one registration
    act(() => {
      transport.emitChannelMessage(NS, 'm')
    })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('m')
    act(() => renderer.unmount())
    spy.mockRestore()
  })

  it('removes the channel on unmount', async () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => renderer.unmount())
    await act(async () => {})
    expect(transport.removeChannelCalls).toEqual([NS])
  })

  it('a remount on the same namespace does not self-collide (T1)', async () => {
    const first = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => first.unmount())
    // Immediately remount — remove() frees the namespace synchronously (T1),
    // so the re-add must not reject `alreadyRegistered` against its predecessor.
    const second = createProbe(<Probe namespace={NS} />)
    await flush()
    await flush()
    expect(latest).not.toBeNull()
    expect(transport.addChannelCalls).toEqual([NS, NS])
    expect(transport.removeChannelCalls).toEqual([NS])
    act(() => second.unmount())
  })

  it('switches channels when the namespace changes', async () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => {
      renderer.update(<Probe namespace={NS_B} />)
    })
    await flush()
    await flush()
    expect(transport.removeChannelCalls).toEqual([NS])
    expect(transport.addChannelCalls).toEqual([NS, NS_B])
    expect(latest!.namespace).toBe(NS_B)
    act(() => renderer.unmount())
  })

  it('recovers when a remount races the predecessor’s in-flight registration', async () => {
    // The narrow PR #610 window: the predecessor's addChannel has dispatched
    // its initial channelStatus (slice entry present → register-once trips)
    // but its native promise hasn't resolved, so the predecessor's cleanup
    // couldn't remove yet (its `created` was still null). The successor must
    // wait for the deferred removal and then register — never issuing its
    // native add BEFORE the predecessor's native remove.
    const order: string[] = []
    let resolveFirstAdd!: () => void
    let firstAdd = true
    transport.addChannelBehavior = async (namespace) => {
      order.push('add')
      transport.emitChannelStatus(namespace, true, true)
      if (firstAdd) {
        firstAdd = false
        await new Promise<void>((resolve) => {
          resolveFirstAdd = resolve
        })
      }
    }
    transport.removeChannelBehavior = async () => {
      order.push('remove')
    }

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const first = createProbe(<Probe namespace={NS} />)
    await flush()
    expect(latest).toBeNull() // native add still in flight
    act(() => first.unmount())
    const second = createProbe(<Probe namespace={NS} />)
    await flush()
    // Successor rejected `alreadyRegistered` (never reached the transport)
    // and is now waiting on the slice.
    expect(transport.addChannelCalls).toEqual([NS])
    expect(latest).toBeNull()

    // Native resolves the predecessor's add → its deferred cleanup removes →
    // the waiting successor re-registers.
    await act(async () => {
      resolveFirstAdd()
    })
    await flush()
    expect(latest).not.toBeNull()
    expect(latest!.namespace).toBe(NS)
    expect(latest!.connected).toBe(true)
    expect(transport.addChannelCalls).toEqual([NS, NS])
    expect(transport.removeChannelCalls).toEqual([NS])
    // Native queue ordering preserved: remove precedes the successor's add.
    expect(order).toEqual(['add', 'remove', 'add'])
    act(() => second.unmount())
  })

  it('waits while the namespace is held elsewhere and registers once freed', async () => {
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const castSession = CastContext.getSessionManager().getCurrentCastSession()!
    let held!: CastChannel
    await act(async () => {
      held = await castSession.addChannel(NS)
    })

    const renderer = createProbe(<Probe namespace={NS} />)
    await flush()
    expect(latest).toBeNull() // register-once: the holder keeps it
    expect(transport.addChannelCalls).toEqual([NS])

    await act(async () => {
      await held.remove()
    })
    await flush()
    expect(latest).not.toBeNull()
    expect(transport.addChannelCalls).toEqual([NS, NS])
    act(() => renderer.unmount())
  })

  it('stops waiting on unmount — a later free must not re-register', async () => {
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const castSession = CastContext.getSessionManager().getCurrentCastSession()!
    let held!: CastChannel
    await act(async () => {
      held = await castSession.addChannel(NS)
    })

    const renderer = createProbe(<Probe namespace={NS} />)
    await flush()
    expect(latest).toBeNull()
    act(() => renderer.unmount())

    await act(async () => {
      await held.remove()
    })
    await flush()
    // The unmounted waiter unsubscribed: no stray registration.
    expect(transport.addChannelCalls).toEqual([NS])
    expect(transport.removeChannelCalls).toEqual([NS])
  })

  it('drops to null when the session ends', async () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(latest).not.toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    await flush()
    expect(latest).toBeNull()
    act(() => renderer.unmount())
  })
})

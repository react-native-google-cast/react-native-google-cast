import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { Device, SessionInfo } from '../../transport/types'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import type { CastChannel } from '../CastChannel'
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

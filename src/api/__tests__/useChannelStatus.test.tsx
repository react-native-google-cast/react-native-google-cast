import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { Device, SessionInfo } from '../../transport/types'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import type { ChannelStatus } from '../../state/channel.slice'
import { useChannelStatus } from '../useChannelStatus'

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

let latest: ChannelStatus | null = null
function Probe({ namespace }: { namespace: string }) {
  latest = useChannelStatus(namespace)
  return null
}

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
  await act(async () => {})
})

afterEach(() => {
  act(() => {
    transport.emitLifecycle({ type: 'ended' })
  })
})

describe('useChannelStatus', () => {
  it('is null while no channel is registered for the namespace', () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    expect(latest).toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latest).toBeNull() // session live, but namespace not registered
    act(() => renderer.unmount())
  })

  it('tracks status updates reactively (iOS dynamic values)', () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
      transport.emitChannelStatus(NS, false, false)
    })
    expect(latest).toEqual({ connected: false, writable: false })
    act(() => {
      transport.emitChannelStatus(NS, true, true)
    })
    expect(latest).toEqual({ connected: true, writable: true })
    act(() => renderer.unmount())
  })

  it('is referentially stable while the status is unchanged', () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
      transport.emitChannelStatus(NS, true, true)
    })
    const before = latest
    act(() => {
      transport.emitChannelStatus(NS, true, true) // identical values
    })
    expect(latest).toBe(before)
    act(() => renderer.unmount())
  })

  it('only reflects its own namespace', () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
      transport.emitChannelStatus(NS_B, true, true)
    })
    expect(latest).toBeNull()
    act(() => renderer.unmount())
  })

  it('drops to null when the channel is removed or the session ends', () => {
    const renderer = createProbe(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
      transport.emitChannelStatus(NS, true, true)
    })
    expect(latest).not.toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    expect(latest).toBeNull()
    act(() => renderer.unmount())
  })
})

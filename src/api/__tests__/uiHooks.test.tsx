import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { CastState, Device, SessionInfo } from '../../transport/types'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import type { CastSession } from '../CastSession'
import { useCastState } from '../useCastState'
import { useDevices } from '../useDevices'
import { useCastSession } from '../useCastSession'
import type { UseCastSessionOptions } from '../useCastSession'
import { useCastDevice } from '../useCastDevice'

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

/** Flush effects (the option-path subscribe/seed runs in an effect). */
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

let latestState: CastState | null = null
function StateProbe() {
  latestState = useCastState()
  return null
}

let latestDevices: readonly Device[] | null = null
function DevicesProbe() {
  latestDevices = useDevices()
  return null
}

let latestSession: CastSession | null = null
function SessionProbe({ options }: { options?: UseCastSessionOptions }) {
  latestSession = useCastSession(options)
  return null
}

let latestDevice: Device | null = null
function DeviceProbe({ options }: { options?: UseCastSessionOptions }) {
  latestDevice = useCastDevice(options)
  return null
}

beforeEach(async () => {
  latestState = null
  latestDevices = null
  latestSession = null
  latestDevice = null
  await flush()
})

afterEach(() => {
  // Reset the singleton store's session state between tests.
  act(() => {
    transport.emitLifecycle({ type: 'ended' })
    transport.emitState('noDevicesAvailable')
    transport.emitDevices([])
  })
})

describe('useCastState', () => {
  it('returns the seeded state synchronously and re-renders on state events', () => {
    const renderer = createProbe(<StateProbe />)
    expect(latestState).toBe('noDevicesAvailable')

    act(() => {
      transport.emitState('connecting')
    })
    expect(latestState).toBe('connecting')

    act(() => {
      transport.emitState('connected')
    })
    expect(latestState).toBe('connected')
    act(() => renderer.unmount())
  })
})

describe('useDevices', () => {
  it('re-renders on device-list events', () => {
    const renderer = createProbe(<DevicesProbe />)
    expect(latestDevices).toEqual([])

    act(() => {
      transport.emitDevices([device('d1'), device('d2')])
    })
    expect(latestDevices!.map((d) => d.deviceId)).toEqual(['d1', 'd2'])
    act(() => renderer.unmount())
  })

  it('is ref-stable across unrelated store changes', () => {
    const renderer = createProbe(<DevicesProbe />)
    act(() => {
      transport.emitDevices([device('d1')])
    })
    const before = latestDevices

    act(() => {
      transport.emitState('connecting')
    })
    expect(latestDevices).toBe(before)
    act(() => renderer.unmount())
  })
})

describe('useCastSession — default path', () => {
  it('is null with no session and returns the memoized façade once started', () => {
    const renderer = createProbe(<SessionProbe />)
    expect(latestSession).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latestSession).not.toBeNull()
    expect(latestSession!.id).toBe('s1')
    act(() => renderer.unmount())
  })

  it('drops to null when the session ends', () => {
    const renderer = createProbe(<SessionProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latestSession).not.toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    expect(latestSession).toBeNull()
    act(() => renderer.unmount())
  })

  it('drops to null on suspended (default behavior)', () => {
    const renderer = createProbe(<SessionProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    act(() => {
      transport.emitLifecycle({ type: 'suspended' })
    })
    expect(latestSession).toBeNull()
    act(() => renderer.unmount())
  })
})

describe('useCastSession — ignoreSessionUpdatesInBackground', () => {
  const OPTS: UseCastSessionOptions = { ignoreSessionUpdatesInBackground: true }

  it('seeds from an already-live session on mount (subscribe-then-reread, E4)', async () => {
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const renderer = createProbe(<SessionProbe options={OPTS} />)
    await flush()
    expect(latestSession).not.toBeNull()
    expect(latestSession!.id).toBe('s1')
    act(() => renderer.unmount())
  })

  it('retains the same reference across suspended', async () => {
    const renderer = createProbe(<SessionProbe options={OPTS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    const retained = latestSession
    expect(retained).not.toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'suspended' })
    })
    expect(latestSession).toBe(retained)
    act(() => renderer.unmount())
  })

  it('hands out a FRESH generation-bound reference on resumed (E5)', async () => {
    const renderer = createProbe(<SessionProbe options={OPTS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    const suspendedRef = latestSession

    act(() => {
      transport.emitLifecycle({ type: 'suspended' })
    })
    expect(latestSession).toBe(suspendedRef)

    act(() => {
      transport.emitLifecycle({ type: 'resumed', session: session('s1') })
    })
    expect(latestSession).not.toBeNull()
    expect(latestSession!.id).toBe('s1')
    // Same session id, but a NEW generation-bound façade — the pre-suspend
    // object is stale (every call would reject noSession).
    expect(latestSession).not.toBe(suspendedRef)
    expect(latestSession!.isActive).toBe(true)
    expect(suspendedRef!.isActive).toBe(false)
    act(() => renderer.unmount())
  })

  it('drops to null on ended / startFailed / resumeFailed', async () => {
    const renderer = createProbe(<SessionProbe options={OPTS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(latestSession).not.toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    expect(latestSession).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s2') })
    })
    expect(latestSession).not.toBeNull()
    act(() => {
      transport.emitLifecycle({
        type: 'resumeFailed',
        error: { code: 'network' },
      })
    })
    expect(latestSession).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s3') })
    })
    expect(latestSession).not.toBeNull()
    act(() => {
      transport.emitLifecycle({
        type: 'startFailed',
        error: { code: 'network' },
      })
    })
    expect(latestSession).toBeNull()
    act(() => renderer.unmount())
  })

  it('re-subscribes when the option flips', async () => {
    // Start WITHOUT the option: suspended nulls the session.
    const renderer = createProbe(<SessionProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latestSession).not.toBeNull()

    // Flip the option ON — the event path must subscribe + seed.
    act(() => {
      renderer.update(<SessionProbe options={OPTS} />)
    })
    await flush()
    expect(latestSession).not.toBeNull()
    const retained = latestSession

    act(() => {
      transport.emitLifecycle({ type: 'suspended' })
    })
    expect(latestSession).toBe(retained)

    // Flip the option OFF mid-suspension — back to the store read (null).
    act(() => {
      renderer.update(<SessionProbe />)
    })
    await flush()
    expect(latestSession).toBeNull()
    act(() => renderer.unmount())
  })
})

describe('useCastDevice', () => {
  it('flips device ↔ null across the session lifecycle', () => {
    const renderer = createProbe(<DeviceProbe />)
    expect(latestDevice).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latestDevice).not.toBeNull()
    expect(latestDevice!.deviceId).toBe('s1')

    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    expect(latestDevice).toBeNull()
    act(() => renderer.unmount())
  })

  it('is ref-stable for the lifetime of a session', () => {
    const renderer = createProbe(<DeviceProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const before = latestDevice
    act(() => {
      transport.emitState('connected')
    })
    expect(latestDevice).toBe(before)
    act(() => renderer.unmount())
  })

  it('re-renders with the fresh device on a mid-session device update', () => {
    const renderer = createProbe(<DeviceProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const before = latestDevice
    expect(before!.friendlyName).toBe('Device s1')

    // Receiver rename mid-session: the memoized façade ref does not change,
    // so only the direct slice subscription can surface this.
    act(() => {
      transport.emitLifecycle({
        type: 'deviceStatusChanged',
        session: {
          ...session('s1'),
          device: { ...device('s1'), friendlyName: 'Bedroom TV' },
        },
      })
    })
    expect(latestDevice!.friendlyName).toBe('Bedroom TV')
    expect(latestDevice).not.toBe(before)
    act(() => renderer.unmount())
  })

  it('stays ref-stable across an unrelated detail change', () => {
    const renderer = createProbe(<DeviceProbe />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    const before = latestDevice
    act(() => {
      transport.emitLifecycle({
        type: 'deviceStatusChanged',
        session: { ...session('s1'), deviceVolume: 0.5 },
      })
    })
    expect(latestDevice).toBe(before)
    act(() => renderer.unmount())
  })

  it('honors ignoreSessionUpdatesInBackground across suspension (E6)', async () => {
    const renderer = createProbe(
      <DeviceProbe options={{ ignoreSessionUpdatesInBackground: true }} />
    )
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    const before = latestDevice
    expect(before).not.toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'suspended' })
    })
    expect(latestDevice).toBe(before)
    act(() => renderer.unmount())
  })
})

import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { Device, SessionInfo } from '../../transport/types'
import type { MediaStatus } from '../../types/MediaStatus'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castStore, castTransport } from '../../state/castStore.singleton'
import { RemoteMediaClient } from '../RemoteMediaClient'
import { useRemoteMediaClient } from '../useRemoteMediaClient'
import { useMediaStatus } from '../useMediaStatus'
import { useStreamPosition } from '../useStreamPosition'

// The singleton normally wires to the native transport (which can't load under
// jest). Swap it for a fake-backed store so the hooks exercise the real
// useSyncExternalStore wiring against scriptable transport events.
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

// The singleton ticker captures Date.now at module load — before
// jest.useFakeTimers() — so its clock can't be moved by the test. Inject a
// controllable clock (a mock-prefixed name, permitted by jest's hoist plugin)
// bound to the SAME mocked castStore.singleton the test already drives.
let mockNow = 0
jest.mock('../../state/progressTicker.singleton', () => {
  const { ProgressTicker } = require('../../state/progressTicker')
  const { castStore: store } = require('../../state/castStore.singleton')
  return { progressTicker: new ProgressTicker(store, () => mockNow) }
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
function mediaStatus(streamPosition = 0): MediaStatus {
  return {
    streamPosition,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    queueItems: [],
  }
}

let latest: {
  client: RemoteMediaClient | null
  status: MediaStatus | null
  position: number | null
}

function Probe(): null {
  latest = {
    client: useRemoteMediaClient(),
    status: useMediaStatus(),
    position: useStreamPosition(),
  }
  return null
}

describe('media hooks — useSyncExternalStore wiring', () => {
  beforeAll(async () => {
    await castStore.ready
  })

  it('track the session + media status through the store', async () => {
    let root!: TestRenderer.ReactTestRenderer
    await act(async () => {
      root = TestRenderer.create(React.createElement(Probe))
    })

    // No session yet → everything null.
    expect(latest.client).toBeNull()
    expect(latest.status).toBeNull()
    expect(latest.position).toBeNull()

    // Session starts → a client appears.
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    expect(latest.client).not.toBeNull()
    const client = latest.client

    // A status streams in → status/position hooks update; the client is the
    // same memoized reference (a status change is not a generation change).
    act(() => {
      transport.emitMediaStatus(mediaStatus(12))
    })
    expect(latest.status?.streamPosition).toBe(12)
    expect(latest.position).toBe(12)
    expect(latest.client).toBe(client)

    // Session ends → client/status/position all clear.
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    expect(latest.client).toBeNull()
    expect(latest.status).toBeNull()
    expect(latest.position).toBeNull()

    act(() => {
      root.unmount()
    })
  })
})

describe('useStreamPosition — ticking', () => {
  beforeAll(async () => {
    await castStore.ready
  })

  it('advances between status pushes while playing', async () => {
    jest.useFakeTimers()
    mockNow = 0
    const positions: (number | null)[] = []
    function Ticking(): null {
      positions.push(useStreamPosition(1))
      return null
    }

    let root!: TestRenderer.ReactTestRenderer
    await act(async () => {
      root = TestRenderer.create(React.createElement(Ticking))
    })
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('tick') })
      transport.emitMediaStatus({
        streamPosition: 30,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        queueItems: [],
        playerState: 'playing',
      })
    })

    // Advance the ticker's clock, then fire the interval → derived position ticks.
    mockNow = 1000
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // 30 (pushed base) + 1s × rate 1 = 31: it ticked strictly forward.
    const last = positions[positions.length - 1]!
    expect(last).toBeGreaterThan(30)
    expect(last).toBe(31)

    act(() => {
      root.unmount()
    })
    jest.useRealTimers()
  })

  it('returns null when there is no media', async () => {
    jest.useFakeTimers()
    mockNow = 0
    // The mocked singleton store persists between tests; a prior test may have
    // left a session active. Force a clean no-media state before rendering.
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })

    const observed: (number | null)[] = []
    function PositionProbe(): null {
      observed.push(useStreamPosition(1))
      return null
    }

    let root!: TestRenderer.ReactTestRenderer
    await act(async () => {
      root = TestRenderer.create(React.createElement(PositionProbe))
    })

    expect(observed[observed.length - 1]).toBeNull()

    act(() => {
      root.unmount()
    })
    jest.useRealTimers()
  })

  it('re-subscribes when the interval changes', async () => {
    jest.useFakeTimers()
    mockNow = 0
    const observed: (number | null)[] = []
    function IntervalProbe({ interval }: { interval: number }): null {
      observed.push(useStreamPosition(interval))
      return null
    }

    let root!: TestRenderer.ReactTestRenderer
    await act(async () => {
      root = TestRenderer.create(
        React.createElement(IntervalProbe, { interval: 1 })
      )
    })
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('ivl') })
      transport.emitMediaStatus({ ...mediaStatus(30), playerState: 'playing' })
    })

    // Re-render with a new interval → the effect deps change, so it must tear
    // down the old subscription and re-subscribe (not stay torn down).
    await act(async () => {
      root.update(React.createElement(IntervalProbe, { interval: 2 }))
    })

    // Advance the ticker's clock + fire the timer; the position must still be a
    // live (non-null) value that ticked forward, proving re-subscription.
    mockNow = 1000
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    const last = observed[observed.length - 1]
    expect(last).not.toBeNull()
    expect(last).toBe(31)

    act(() => {
      root.unmount()
    })
    jest.useRealTimers()
  })
})

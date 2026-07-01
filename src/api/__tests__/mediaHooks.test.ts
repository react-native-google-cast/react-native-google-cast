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

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // The last observed position is >= the pushed base (it ticked forward).
    expect(positions[positions.length - 1]!).toBeGreaterThanOrEqual(30)

    act(() => {
      root.unmount()
    })
    jest.useRealTimers()
  })
})

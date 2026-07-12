import { channelSlice, type ChannelState } from '../channel.slice'
import type {
  Device,
  SessionInfo,
  SessionLifecycleEvent,
} from '../../transport/types'
import type { StoreEvent } from '../slice'

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
const status = (
  namespace: string,
  connected = true,
  writable = true
): StoreEvent => ({ kind: 'channelStatus', namespace, connected, writable })
const lifecycle = (event: SessionLifecycleEvent): StoreEvent => ({
  kind: 'lifecycle',
  event,
})

const NS = 'urn:x-cast:com.example.a'
const NS_B = 'urn:x-cast:com.example.b'

function liveState(): ChannelState {
  return channelSlice.reduce(
    channelSlice.seed({
      castState: 'connected',
      playServicesState: 'success',
      devices: [],
    }),
    lifecycle({ type: 'started', session: session('s1') })
  )
}

describe('channel.slice', () => {
  it('seeds empty (idle without a session, live with one)', () => {
    const idle = channelSlice.seed({
      castState: 'notConnected',
      playServicesState: 'success',
      devices: [],
    })
    expect(idle).toEqual({ statuses: {}, live: false })
    const live = channelSlice.seed({
      castState: 'connected',
      playServicesState: 'success',
      devices: [],
      currentSession: session('s1'),
    })
    expect(live).toEqual({ statuses: {}, live: true })
  })

  it('channelStatus sets/replaces the namespace entry while live', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS, false, false))
    expect(state.statuses[NS]).toEqual({ connected: false, writable: false })
    state = channelSlice.reduce(state, status(NS, true, true))
    expect(state.statuses[NS]).toEqual({ connected: true, writable: true })
  })

  it('is ref-stable when the status is unchanged (Invariant 2)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS, true, true))
    const again = channelSlice.reduce(state, status(NS, true, true))
    expect(again).toBe(state)
  })

  it('drops a channelStatus while no session is live', () => {
    const idle = channelSlice.seed({
      castState: 'notConnected',
      playServicesState: 'success',
      devices: [],
    })
    expect(channelSlice.reduce(idle, status(NS))).toBe(idle)
  })

  it('channelRemoved deletes only that namespace (ref-stable when absent)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS))
    state = channelSlice.reduce(state, status(NS_B))
    const removed = channelSlice.reduce(state, {
      kind: 'channelRemoved',
      namespace: NS,
    })
    expect(removed.statuses[NS]).toBeUndefined()
    expect(removed.statuses[NS_B]).toEqual({ connected: true, writable: true })
    expect(
      channelSlice.reduce(removed, { kind: 'channelRemoved', namespace: NS })
    ).toBe(removed)
  })

  it('clears on teardown and on a new session (establish)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS))
    const torn = channelSlice.reduce(state, lifecycle({ type: 'ended' }))
    expect(torn).toEqual({ statuses: {}, live: false })

    let state2 = liveState()
    state2 = channelSlice.reduce(state2, status(NS))
    const replaced = channelSlice.reduce(
      state2,
      lifecycle({ type: 'started', session: session('s2') })
    )
    expect(replaced).toEqual({ statuses: {}, live: true })
  })

  it('is ref-stable across teardown/establish when already empty', () => {
    const state = liveState()
    expect(
      channelSlice.reduce(
        state,
        lifecycle({ type: 'started', session: session('s2') })
      )
    ).toBe(state)
    const idle = channelSlice.reduce(state, lifecycle({ type: 'ended' }))
    expect(channelSlice.reduce(idle, lifecycle({ type: 'ended' }))).toBe(idle)
  })

  it('ignores unrelated events (same ref)', () => {
    const state = liveState()
    expect(
      channelSlice.reduce(state, { kind: 'state', castState: 'connected' })
    ).toBe(state)
  })
})

import type { SessionInfo } from '../../transport/types'
import type { Device } from '../../types/Device'
import type { StoreEvent } from '../slice'
import {
  SESSION_SLICE_KEY,
  sessionSlice,
  type SessionState,
} from '../session.slice'

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: id,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}
function session(id: string, detail?: Partial<SessionInfo>): SessionInfo {
  return { sessionId: id, device: device(id), ...detail }
}
function lifecycle(type: string, s?: SessionInfo): StoreEvent {
  return { kind: 'lifecycle', event: { type: type as never, session: s } }
}

const EMPTY: SessionState = { current: null, generation: 0, detail: null }

describe('sessionSlice — key + seed', () => {
  it('uses the exported slice key', () => {
    expect(sessionSlice.key).toBe(SESSION_SLICE_KEY)
  })

  it('seeds detail from a cold-start session', () => {
    const seeded = sessionSlice.seed({
      currentSession: session('s0', { deviceVolume: 0.5 }),
    } as never)
    expect(seeded.generation).toBe(1)
    expect(seeded.detail?.deviceVolume).toBe(0.5)
  })

  it('seeds null detail with no cold-start session', () => {
    expect(sessionSlice.seed({} as never).detail).toBeNull()
  })
})

describe('sessionSlice — detail lifecycle', () => {
  it('sets detail on establish and clears it on teardown', () => {
    const started = sessionSlice.reduce(
      EMPTY,
      lifecycle('started', session('s1', { deviceVolume: 0.3 }))
    )
    expect(started.detail?.deviceVolume).toBe(0.3)
    const ended = sessionSlice.reduce(started, lifecycle('ended'))
    expect(ended.current).toBeNull()
    expect(ended.detail).toBeNull()
  })

  it('replaces detail wholesale on a detail-change event, preserving current ref', () => {
    const started = sessionSlice.reduce(
      EMPTY,
      lifecycle('started', session('s1', { deviceVolume: 0.1 }))
    )
    const changed = sessionSlice.reduce(
      started,
      lifecycle('deviceStatusChanged', session('s1', { deviceVolume: 0.8 }))
    )
    expect(changed.detail?.deviceVolume).toBe(0.8)
    // generation unchanged; current is the SAME frozen object (Invariant 2).
    expect(changed.generation).toBe(started.generation)
    expect(changed.current).toBe(started.current)
  })

  it('drops a detail-change that races a teardown (no live session)', () => {
    const started = sessionSlice.reduce(
      EMPTY,
      lifecycle('started', session('s1'))
    )
    const ended = sessionSlice.reduce(started, lifecycle('ended'))
    const racing = sessionSlice.reduce(
      ended,
      lifecycle(
        'standbyStateChanged',
        session('s1', { standbyState: 'active' })
      )
    )
    // No resurrection — same (torn-down) state ref returned.
    expect(racing).toBe(ended)
    expect(racing.detail).toBeNull()
  })

  it('returns the same state ref for unrelated events (Invariant 2)', () => {
    const started = sessionSlice.reduce(
      EMPTY,
      lifecycle('started', session('s1'))
    )
    const same = sessionSlice.reduce(started, {
      kind: 'devices',
      devices: [],
    } as StoreEvent)
    expect(same).toBe(started)
  })
})

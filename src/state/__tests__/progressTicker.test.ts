import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import type { MediaStatus } from '../../types/MediaStatus'
import { CastStore } from '../CastStore'
import { ProgressTicker } from '../progressTicker'

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
function status(over: Partial<MediaStatus> = {}): MediaStatus {
  return {
    streamPosition: 0,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    queueItems: [],
    ...over,
  }
}

// A controllable clock; ms since an arbitrary origin.
function makeClock() {
  const state = { ms: 0 }
  return { now: () => state.ms, advance: (ms: number) => (state.ms += ms), state }
}

async function makeTicker(now: () => number) {
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  await store.ready
  const ticker = new ProgressTicker(store, now)
  return { transport, store, ticker }
}

describe('ProgressTicker — derivation', () => {
  it('returns null when there is no media', async () => {
    const clock = makeClock()
    const { ticker } = await makeTicker(clock.now)
    expect(ticker.getPosition()).toBeNull()
    expect(ticker.getDuration()).toBe(0)
  })

  it('freezes at streamPosition when not playing', async () => {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    const off = ticker.subscribe(() => {}) // activates the store subscription
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status({ streamPosition: 10, playerState: 'paused' }))

    clock.advance(5000)
    expect(ticker.getPosition()).toBe(10)
    off()
  })

  it('advances by elapsed × playbackRate while playing', async () => {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    const off = ticker.subscribe(() => {})
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(
      status({ streamPosition: 10, playbackRate: 2, playerState: 'playing' })
    )

    clock.advance(3000) // 3s real → 6s of media at 2×
    expect(ticker.getPosition()).toBe(16)
    off()
  })

  it('clamps to duration for VOD but leaves live un-clamped', async () => {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    const off = ticker.subscribe(() => {})
    transport.emitLifecycle({ type: 'started', session: session('s1') })

    // VOD: streamDuration = 12 → clamp.
    transport.emitMediaStatus(
      status({
        streamPosition: 10,
        playerState: 'playing',
        mediaInfo: { contentUrl: 'x', streamDuration: 12 },
      })
    )
    clock.advance(5000)
    expect(ticker.getPosition()).toBe(12)

    // Live: no streamDuration → un-clamped.
    transport.emitMediaStatus(
      status({ streamPosition: 100, playerState: 'playing' })
    )
    clock.advance(5000)
    expect(ticker.getPosition()).toBe(105)
    off()
  })

  it('resyncs the anchor on every status push (no drift)', async () => {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    const off = ticker.subscribe(() => {})
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status({ streamPosition: 10, playerState: 'playing' }))

    clock.advance(4000)
    expect(ticker.getPosition()).toBe(14)

    // Receiver reports 20 (e.g. after a seek); position tracks the new base.
    transport.emitMediaStatus(status({ streamPosition: 20, playerState: 'playing' }))
    clock.advance(1000)
    expect(ticker.getPosition()).toBe(21)
    off()
  })
})

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
  return {
    now: () => state.ms,
    advance: (ms: number) => (state.ms += ms),
    state,
  }
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
    transport.emitMediaStatus(
      status({ streamPosition: 10, playerState: 'paused' })
    )

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
    transport.emitMediaStatus(
      status({ streamPosition: 10, playerState: 'playing' })
    )

    clock.advance(4000)
    expect(ticker.getPosition()).toBe(14)

    // Receiver reports 20 (e.g. after a seek); position tracks the new base.
    transport.emitMediaStatus(
      status({ streamPosition: 20, playerState: 'playing' })
    )
    clock.advance(1000)
    expect(ticker.getPosition()).toBe(21)
    off()
  })

  it('does not reanchor on an unrelated store change (media slice unchanged)', async () => {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    const off = ticker.subscribe(() => {})
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(
      status({ streamPosition: 10, playerState: 'playing' })
    )

    clock.advance(2000)
    expect(ticker.getPosition()).toBe(12)

    // Unrelated store change (cast-state) leaves the media slice untouched, so
    // the `status === anchorStatus` guard must keep the ORIGINAL anchor: the
    // position keeps advancing continuously rather than resetting to 12.
    transport.emitState('connected')

    clock.advance(2000)
    expect(ticker.getPosition()).toBe(14)
    off()
  })
})

describe('ProgressTicker — timer & arbitration', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  async function playing() {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(
      status({ streamPosition: 0, playerState: 'playing' })
    )
    return { clock, ticker, transport }
  }

  it('notifies a subscriber once per interval while playing', async () => {
    const { clock, ticker } = await playing()
    const listener = jest.fn()
    ticker.subscribe(listener, 1)

    clock.advance(1000)
    jest.advanceTimersByTime(1000)
    clock.advance(1000)
    jest.advanceTimersByTime(1000)

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('runs ONE timer at the min interval for differing subscribers', async () => {
    const { clock, ticker } = await playing()
    const fast = jest.fn()
    const slow = jest.fn()
    ticker.subscribe(fast, 1)
    ticker.subscribe(slow, 5)

    // Min interval is 1s → both fire every second (tick-all policy).
    clock.advance(1000)
    jest.advanceTimersByTime(1000)
    expect(fast).toHaveBeenCalledTimes(1)
    expect(slow).toHaveBeenCalledTimes(1)
    // Only one underlying interval exists.
    expect(jest.getTimerCount()).toBe(1)
  })

  it('recomputes the min interval and stops on last unsubscribe', async () => {
    const { ticker } = await playing()
    const a = jest.fn()
    const b = jest.fn()
    const offA = ticker.subscribe(a, 1)
    const offB = ticker.subscribe(b, 3)
    expect(jest.getTimerCount()).toBe(1)

    offA() // now only the 3s subscriber remains → timer restarts at 3s
    expect(jest.getTimerCount()).toBe(1)

    offB() // last one gone → timer stops
    expect(jest.getTimerCount()).toBe(0)
  })

  it('stops the timer when playback pauses and restarts on resume', async () => {
    const { ticker, transport } = await playing()
    ticker.subscribe(jest.fn(), 1)
    expect(jest.getTimerCount()).toBe(1)

    transport.emitMediaStatus(
      status({ streamPosition: 5, playerState: 'paused' })
    )
    expect(jest.getTimerCount()).toBe(0)

    transport.emitMediaStatus(
      status({ streamPosition: 5, playerState: 'playing' })
    )
    expect(jest.getTimerCount()).toBe(1)
  })

  it('stops the timer and returns null on session teardown', async () => {
    const { ticker, transport } = await playing()
    ticker.subscribe(jest.fn(), 1)
    expect(jest.getTimerCount()).toBe(1)

    transport.emitLifecycle({ type: 'ended' })
    expect(jest.getTimerCount()).toBe(0)
    expect(ticker.getPosition()).toBeNull()
  })

  it('clamps a non-positive interval (no zero-delay busy loop)', async () => {
    const { clock, ticker } = await playing()
    const listener = jest.fn()
    ticker.subscribe(listener, 0) // must be floored to 1s, not setInterval(fn, 0)

    // Exactly one shared timer, running at the 1s floor.
    expect(jest.getTimerCount()).toBe(1)

    clock.advance(1000)
    jest.advanceTimersByTime(1000)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('a second subscriber joining mid-play does NOT reanchor the position', async () => {
    const { clock, ticker } = await playing()
    ticker.subscribe(jest.fn(), 1) // first subscriber anchors at clock 0

    clock.advance(2000)
    expect(ticker.getPosition()).toBe(2)

    // A second subscriber must NOT re-anchor (the `if (!this.storeUnsub)`
    // guard means only the first subscriber anchors); position stays at 2.
    ticker.subscribe(jest.fn(), 5)
    expect(ticker.getPosition()).toBe(2)

    clock.advance(1000)
    expect(ticker.getPosition()).toBe(3)
  })
})

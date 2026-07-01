# Media-progress ticking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give v5 a locally-ticking `streamPosition` with interval arbitration and full v4 API parity (`useStreamPosition(interval)` + `RemoteMediaClient.onMediaProgressUpdated`), all in pure TS.

**Architecture:** A single `ProgressTicker` (pure TS) reads the central store's media slice and derives position = last `MediaStatus.streamPosition` + elapsed × `playbackRate` while `playerState === 'playing'`, resyncing on every status push. It owns one `setInterval` running at the arbitrated **min** subscriber interval, active only while playing and subscribed. The hook and the façade method are thin wrappers over one module-level ticker singleton.

**Tech Stack:** TypeScript, React (`useState`/`useEffect`), Jest + `react-test-renderer`, existing `CastStore` + `FakeCastTransport` test harness.

**Spec:** `docs/superpowers/specs/2026-07-01-media-progress-ticking-design.md`

---

## File Structure

- **Create** `src/state/progressTicker.ts` — the `ProgressTicker` class (derivation + timer + arbitration). No native import; unit-tested directly with a `CastStore`+`FakeCastTransport`.
- **Create** `src/state/progressTicker.singleton.ts` — `export const progressTicker = new ProgressTicker(castStore)`, mirroring `castStore.singleton.ts`. Isolates the native-backed singleton from the class's test path.
- **Create** `src/state/__tests__/progressTicker.test.ts` — all derivation/arbitration/lifecycle unit tests.
- **Modify** `src/api/useStreamPosition.ts` — rewrite to tick via the singleton, add `interval` param.
- **Modify** `src/api/RemoteMediaClient.ts` — add `onMediaProgressUpdated(handler, interval?)`.
- **Modify** `src/api/__tests__/mediaHooks.test.ts` — add a ticking test for `useStreamPosition(interval)`.
- **Modify** `src/api/__tests__/RemoteMediaClient.test.ts` — add an `onMediaProgressUpdated` test.

**Key types (locked; reused across tasks):**
```ts
// Store capability the ticker needs (both already on CastStore):
type TickerStoreView = Pick<CastStore, 'getSliceState' | 'subscribe'>
// Public handler shape (v4 parity):
type ProgressHandler = (position: number, duration: number) => void
```

---

## Task 1: `ProgressTicker` derivation (position/duration, no timer yet)

**Files:**
- Create: `src/state/progressTicker.ts`
- Test: `src/state/__tests__/progressTicker.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/progressTicker.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/state/__tests__/progressTicker.test.ts`
Expected: FAIL — `Cannot find module '../progressTicker'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/state/progressTicker.ts`:

```ts
import type { CastStore } from './CastStore'
import { MEDIA_SLICE_KEY, type MediaState } from './media.slice'
import type { MediaStatus } from '../types/MediaStatus'

/** The store capability the ticker needs (both already on {@link CastStore}). */
type TickerStoreView = Pick<CastStore, 'getSliceState' | 'subscribe'>

/** A progress listener; pulls the current value via the ticker's getters. */
type Listener = () => void

/**
 * Derives a locally-ticking stream position from the store's media slice — pure
 * TS, no native timer. Position advances only while `playerState === 'playing'`,
 * resyncing to the receiver's reported `streamPosition` on every status push, so
 * clock drift never accumulates. One shared `setInterval` runs at the smallest
 * subscriber interval and only while playing (added in Task 2).
 */
export class ProgressTicker {
  private readonly store: TickerStoreView
  private readonly now: () => number

  private storeUnsub: (() => void) | null = null
  private anchorStatus: MediaStatus | null = null
  private anchorTime = 0

  constructor(store: TickerStoreView, now: () => number = Date.now) {
    this.store = store
    this.now = now
  }

  /** Register a listener. Returns an unsubscribe. (Timer added in Task 2.) */
  subscribe(listener: Listener): () => void {
    // Placeholder membership until Task 2 introduces the subscriber map + timer.
    if (!this.storeUnsub) {
      this.storeUnsub = this.store.subscribe(() => this.onStoreChange())
      this.reanchor()
    }
    return () => {
      if (this.storeUnsub) {
        this.storeUnsub()
        this.storeUnsub = null
      }
      this.anchorStatus = null
    }
  }

  /** Current derived position in seconds, or `null` when there is no media. */
  getPosition(): number | null {
    const status = this.status()
    if (!status) return null
    let pos = status.streamPosition
    // Advance only when the *current* status is the one we anchored to.
    if (status.playerState === 'playing' && status === this.anchorStatus) {
      pos += ((this.now() - this.anchorTime) / 1000) * (status.playbackRate || 1)
    }
    const duration = this.getDuration()
    if (duration > 0) return Math.min(Math.max(pos, 0), duration)
    return pos < 0 ? 0 : pos
  }

  /** Current media duration in seconds; `0` when unknown/live. */
  getDuration(): number {
    return this.status()?.mediaInfo?.streamDuration ?? 0
  }

  private status(): MediaStatus | null {
    return this.store.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
  }

  private onStoreChange(): void {
    const status = this.status()
    if (status !== this.anchorStatus) this.reanchor()
  }

  private reanchor(): void {
    this.anchorStatus = this.status()
    this.anchorTime = this.now()
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/state/__tests__/progressTicker.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/progressTicker.ts src/state/__tests__/progressTicker.test.ts
git commit -m "feat(v5): ProgressTicker position derivation (v5-aug.6)"
```

---

## Task 2: Shared timer + min-interval arbitration + play/teardown lifecycle

**Files:**
- Modify: `src/state/progressTicker.ts`
- Test: `src/state/__tests__/progressTicker.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/state/__tests__/progressTicker.test.ts`:

```ts
describe('ProgressTicker — timer & arbitration', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  async function playing() {
    const clock = makeClock()
    const { ticker, transport } = await makeTicker(clock.now)
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status({ streamPosition: 0, playerState: 'playing' }))
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

    transport.emitMediaStatus(status({ streamPosition: 5, playerState: 'paused' }))
    expect(jest.getTimerCount()).toBe(0)

    transport.emitMediaStatus(status({ streamPosition: 5, playerState: 'playing' }))
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
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn jest src/state/__tests__/progressTicker.test.ts -t "timer & arbitration"`
Expected: FAIL — subscribers not ticked / `getTimerCount` mismatches (timer not implemented).

- [ ] **Step 3: Implement the timer + arbitration**

Replace the subscriber/timer internals of `src/state/progressTicker.ts`. Full file:

```ts
import type { CastStore } from './CastStore'
import { MEDIA_SLICE_KEY, type MediaState } from './media.slice'
import type { MediaStatus } from '../types/MediaStatus'

/** The store capability the ticker needs (both already on {@link CastStore}). */
type TickerStoreView = Pick<CastStore, 'getSliceState' | 'subscribe'>

/** A progress listener; pulls the current value via the ticker's getters. */
type Listener = () => void

interface Subscriber {
  readonly listener: Listener
  readonly interval: number
}

/**
 * Derives a locally-ticking stream position from the store's media slice — pure
 * TS, no native timer. Position advances only while `playerState === 'playing'`,
 * resyncing to the receiver's reported `streamPosition` on every status push, so
 * clock drift never accumulates.
 *
 * One shared `setInterval` runs at the smallest subscriber interval and only
 * while playing + subscribed; it is recomputed on every membership change and on
 * play-state transitions, and torn down when the last subscriber leaves.
 */
export class ProgressTicker {
  private readonly store: TickerStoreView
  private readonly now: () => number

  private readonly subs = new Map<object, Subscriber>()
  private storeUnsub: (() => void) | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private timerInterval = 0

  private anchorStatus: MediaStatus | null = null
  private anchorTime = 0

  constructor(store: TickerStoreView, now: () => number = Date.now) {
    this.store = store
    this.now = now
  }

  /**
   * Register a progress listener at a given update interval (seconds, default 1).
   * The listener is invoked on each shared tick while playing and whenever the
   * media slice changes (a new status push, pause/resume, or teardown). Returns
   * an unsubscribe.
   */
  subscribe(listener: Listener, interval = 1): () => void {
    const key = {}
    this.subs.set(key, { listener, interval })
    if (!this.storeUnsub) {
      this.storeUnsub = this.store.subscribe(() => this.onStoreChange())
      this.reanchor()
    }
    this.reconcileTimer()
    return () => {
      if (!this.subs.delete(key)) return
      if (this.subs.size === 0) this.teardown()
      else this.reconcileTimer()
    }
  }

  /** Current derived position in seconds, or `null` when there is no media. */
  getPosition(): number | null {
    const status = this.status()
    if (!status) return null
    let pos = status.streamPosition
    if (status.playerState === 'playing' && status === this.anchorStatus) {
      pos += ((this.now() - this.anchorTime) / 1000) * (status.playbackRate || 1)
    }
    const duration = this.getDuration()
    if (duration > 0) return Math.min(Math.max(pos, 0), duration)
    return pos < 0 ? 0 : pos
  }

  /** Current media duration in seconds; `0` when unknown/live. */
  getDuration(): number {
    return this.status()?.mediaInfo?.streamDuration ?? 0
  }

  private status(): MediaStatus | null {
    return this.store.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
  }

  private onStoreChange(): void {
    const status = this.status()
    if (status !== this.anchorStatus) this.reanchor()
    this.reconcileTimer()
    this.notify()
  }

  private reanchor(): void {
    this.anchorStatus = this.status()
    this.anchorTime = this.now()
  }

  private isPlaying(): boolean {
    return this.status()?.playerState === 'playing'
  }

  private minInterval(): number {
    let min = Infinity
    for (const { interval } of this.subs.values()) min = Math.min(min, interval)
    return min === Infinity ? 1 : min
  }

  private reconcileTimer(): void {
    const want = this.subs.size > 0 && this.isPlaying()
    const min = this.minInterval()
    if (want && (this.timer === null || min !== this.timerInterval)) {
      if (this.timer !== null) clearInterval(this.timer)
      this.timerInterval = min
      this.timer = setInterval(() => this.notify(), min * 1000)
    } else if (!want && this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
      this.timerInterval = 0
    }
  }

  private notify(): void {
    for (const { listener } of [...this.subs.values()]) listener()
  }

  private teardown(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.timerInterval = 0
    if (this.storeUnsub) {
      this.storeUnsub()
      this.storeUnsub = null
    }
    this.anchorStatus = null
  }
}
```

- [ ] **Step 4: Run the whole ticker suite**

Run: `yarn jest src/state/__tests__/progressTicker.test.ts`
Expected: PASS (all derivation + timer/arbitration tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/progressTicker.ts src/state/__tests__/progressTicker.test.ts
git commit -m "feat(v5): ProgressTicker shared timer + min-interval arbitration (v5-aug.6)"
```

---

## Task 3: Ticker singleton

**Files:**
- Create: `src/state/progressTicker.singleton.ts`

- [ ] **Step 1: Write the singleton**

Create `src/state/progressTicker.singleton.ts`:

```ts
import { castStore } from './castStore.singleton'
import { ProgressTicker } from './progressTicker'

/**
 * The process-wide progress ticker, bound to the {@link castStore} singleton.
 * Imported only by the façade layer (`useStreamPosition`,
 * `RemoteMediaClient.onMediaProgressUpdated`) — never by the ticker's own tests,
 * which construct a {@link ProgressTicker} over a `FakeCastTransport`-backed
 * store so this module's native import stays out of their path.
 */
export const progressTicker = new ProgressTicker(castStore)
```

- [ ] **Step 2: Typecheck**

Run: `yarn typescript`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/state/progressTicker.singleton.ts
git commit -m "feat(v5): progressTicker singleton bound to castStore (v5-aug.6)"
```

---

## Task 4: `useStreamPosition(interval)` ticks via the ticker

**Files:**
- Modify: `src/api/useStreamPosition.ts`
- Test: `src/api/__tests__/mediaHooks.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/api/__tests__/mediaHooks.test.ts`. First extend the `mediaStatus` helper and the `Probe` so an interval + playing state can be exercised. Add a **new** test block after the existing `describe`:

```ts
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
```

> Note: this test asserts the wiring (hook re-renders off the ticker); exact
> arithmetic is covered deterministically in `progressTicker.test.ts` with an
> injected clock. Under fake timers the singleton's default `Date.now` is also
> faked, so `advanceTimersByTime` moves both the interval and the clock.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/api/__tests__/mediaHooks.test.ts -t "ticking"`
Expected: FAIL — `useStreamPosition` (current impl) never advances; last value stays `30` only because of the push, and with no interval arg it won't re-render on a tick. (Failure may be a timeout or a stale value depending on the current impl.)

- [ ] **Step 3: Rewrite the hook**

Replace `src/api/useStreamPosition.ts` entirely:

```ts
import { useEffect, useState } from 'react'
import { progressTicker } from '../state/progressTicker.singleton'

/**
 * Hook returning the current stream position in seconds, ticking locally between
 * receiver status pushes while playback is `playing`. Returns `null` when there
 * is no active media.
 *
 * @param interval update interval in seconds (default `1`). Multiple subscribers
 *   with differing intervals share a single timer at the smallest interval.
 * @returns the current position in seconds, or `null`.
 */
export function useStreamPosition(interval = 1): number | null {
  const [position, setPosition] = useState<number | null>(() =>
    progressTicker.getPosition()
  )
  useEffect(() => {
    const update = () => setPosition(progressTicker.getPosition())
    update()
    return progressTicker.subscribe(update, interval)
  }, [interval])
  return position
}
```

- [ ] **Step 4: Run the media-hook tests**

Run: `yarn jest src/api/__tests__/mediaHooks.test.ts`
Expected: PASS — both the pre-existing `useSyncExternalStore wiring` test (no-arg `useStreamPosition()` still returns `12` then `null`) and the new ticking test.

- [ ] **Step 5: Commit**

```bash
git add src/api/useStreamPosition.ts src/api/__tests__/mediaHooks.test.ts
git commit -m "feat(v5): useStreamPosition ticks via ProgressTicker with interval (v5-aug.6)"
```

---

## Task 5: `RemoteMediaClient.onMediaProgressUpdated`

**Files:**
- Modify: `src/api/RemoteMediaClient.ts`
- Test: `src/api/__tests__/RemoteMediaClient.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/api/__tests__/RemoteMediaClient.test.ts`. This test drives the real singleton store + ticker (mock the singleton the same way `mediaHooks.test.ts` does — copy that `jest.mock('../../state/castStore.singleton', ...)` block to the top of this file **if it is not already present**). Then:

```ts
describe('RemoteMediaClient — onMediaProgressUpdated', () => {
  beforeAll(async () => {
    await castStore.ready
  })

  it('delivers (position, duration) and stops after remove()', async () => {
    jest.useFakeTimers()
    transport.emitLifecycle({ type: 'started', session: session('rmc') })
    const client = RemoteMediaClient.current(castStore, castTransport)!
    expect(client).not.toBeNull()

    const calls: Array<[number, number]> = []
    const sub = client.onMediaProgressUpdated((p, d) => calls.push([p, d]), 1)

    transport.emitMediaStatus({
      streamPosition: 0,
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      queueItems: [],
      playerState: 'playing',
      mediaInfo: { contentUrl: 'x', streamDuration: 100 },
    })
    jest.advanceTimersByTime(2000)
    expect(calls.length).toBeGreaterThanOrEqual(1)
    expect(calls[calls.length - 1]![1]).toBe(100) // duration threaded through

    const before = calls.length
    sub.remove()
    jest.advanceTimersByTime(3000)
    expect(calls.length).toBe(before) // no more deliveries after remove()

    transport.emitLifecycle({ type: 'ended' })
    jest.useRealTimers()
  })
})
```

> Ensure the file imports `castStore`, `castTransport` from
> `'../../state/castStore.singleton'` and the `session` helper (copy from
> `mediaHooks.test.ts` if absent).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/api/__tests__/RemoteMediaClient.test.ts -t "onMediaProgressUpdated"`
Expected: FAIL — `client.onMediaProgressUpdated is not a function`.

- [ ] **Step 3: Implement the method**

In `src/api/RemoteMediaClient.ts`:

1. Add imports near the top (after the existing type imports):

```ts
import type { EventSubscription } from './subscribeSelector'
import { progressTicker } from '../state/progressTicker.singleton'
```

2. Add the method inside the `RemoteMediaClient` class, immediately after `getStreamPosition()` (around line 124):

```ts
  /**
   * Listen for ticking progress of the currently playing media. The handler
   * receives `(position, duration)` in seconds, driven by a shared TS ticker
   * (position advances locally while playing, resyncing on each status push).
   *
   * Unlike v4 (single listener), v5 supports multiple concurrent listeners;
   * differing intervals share one timer at the smallest interval.
   *
   * @param handler called with `(position, duration)` on each update.
   * @param interval update frequency in seconds (default `1`).
   * @returns a subscription; call `remove()` to stop listening.
   */
  onMediaProgressUpdated(
    handler: (position: number, duration: number) => void,
    interval = 1
  ): EventSubscription {
    const unsubscribe = progressTicker.subscribe(() => {
      const position = progressTicker.getPosition()
      if (position !== null) handler(position, progressTicker.getDuration())
    }, interval)
    return { remove: unsubscribe }
  }
```

> The subscription is intentionally *not* generation-gated: progress is inherently
> "the current session's media", and the ticker stops emitting the instant the
> media slice clears on teardown — matching v4's "currently playing media"
> semantics.

- [ ] **Step 4: Run the test**

Run: `yarn jest src/api/__tests__/RemoteMediaClient.test.ts`
Expected: PASS (existing tests + the new `onMediaProgressUpdated` test).

- [ ] **Step 5: Commit**

```bash
git add src/api/RemoteMediaClient.ts src/api/__tests__/RemoteMediaClient.test.ts
git commit -m "feat(v5): RemoteMediaClient.onMediaProgressUpdated via shared ticker (v5-aug.6)"
```

---

## Task 6: Full verification + spec note

**Files:**
- Modify: `docs/superpowers/specs/2026-07-01-media-progress-ticking-design.md` (mark native scope confirmed)

- [ ] **Step 1: Run the full TS test suite**

Run: `yarn jest`
Expected: PASS — all suites green (previous 95 + the new ticker/hook/RMC tests).

- [ ] **Step 2: Typecheck + lint**

Run: `yarn typescript && yarn lint`
Expected: no errors.

- [ ] **Step 3: Confirm public exports**

Verify `src/index.ts` still exports `useStreamPosition` (unchanged named export) and that `RemoteMediaClient` is exported. No new top-level export is required (`onMediaProgressUpdated` is a method; `progressTicker` stays internal).

Run: `grep -nE "useStreamPosition|RemoteMediaClient" src/index.ts`
Expected: both already present; if `useStreamPosition` is missing, add `export { useStreamPosition } from './api/useStreamPosition'`.

- [ ] **Step 4: Append a closing note to the spec**

Add to the end of `docs/superpowers/specs/2026-07-01-media-progress-ticking-design.md`:

```markdown
## Implementation note (2026-07-01)

Delivered in pure TS as designed: `ProgressTicker` + singleton, `useStreamPosition(interval)`,
`RemoteMediaClient.onMediaProgressUpdated`. No native (Swift/Kotlin) changes were needed —
the existing `MediaStatus` push stream is sufficient. All tests green via `yarn jest`.
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-01-media-progress-ticking-design.md
git commit -m "docs(v5): confirm media-progress ticking shipped TS-only (v5-aug.6)"
```

---

## Self-Review

**Spec coverage:**
- TS-derived ticking → Task 1 (derivation) + Task 2 (timer). ✓
- Min-interval, tick-all arbitration → Task 2. ✓
- `useStreamPosition(interval)` → Task 4. ✓
- `onMediaProgressUpdated(handler, interval)` full v4 parity → Task 5. ✓
- Resync-on-push (no drift) → Task 1 test + Task 2 impl. ✓
- Pause freezes / timer off; resume restarts → Task 2. ✓
- VOD clamp; live un-clamped (judgment A) → Task 1. ✓
- Teardown → null, timer stopped → Task 2. ✓
- `playbackRate` scaling → Task 1. ✓
- No native changes (scope) → Task 6 note. ✓
- Testing matrix (spec §Testing) → Tasks 1–2 cover single/multi/unsubscribe/resync/pause/clamp/teardown/rate; hook + RMC wiring in Tasks 4–5. ✓

**Placeholder scan:** none — every code step shows complete code; commands include expected output.

**Type consistency:** `TickerStoreView`, `ProgressHandler`/`(position, duration)`, `subscribe(listener, interval)`, `getPosition()`, `getDuration()`, `progressTicker` singleton, `EventSubscription { remove() }` — used identically across Tasks 1–5. The Task 1 stub `subscribe(listener)` is intentionally superseded by the full `subscribe(listener, interval = 1)` in Task 2 (Task 1's tests pass an interval-less call, which still type-checks against the default param).

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
 * Floor for a subscriber's update interval (seconds). A tiny positive interval
 * (e.g. `0.001`) would otherwise drive a near-busy timer; `interval` is public
 * API, so clamp it. A non-positive/NaN interval still falls back to {@link
 * DEFAULT_INTERVAL}.
 */
const MIN_INTERVAL = 0.25
const DEFAULT_INTERVAL = 1

/**
 * Derives a locally-ticking stream position from the store's media slice — pure
 * TS, no native timer. Position advances only while `playerState === 'playing'`,
 * resyncing to the receiver's reported `streamPosition` on every status push, so
 * clock drift never accumulates.
 *
 * One shared `setInterval` runs at the smallest subscriber interval and only
 * while playing + subscribed; it is recomputed on every membership change and on
 * play-state transitions, and torn down when the last subscriber leaves.
 *
 * The store subscription, by contrast, is lifetime-bound (opened in the
 * constructor, never closed): the anchor must resync on every media-status push
 * even with zero listeners, so a listener attaching mid-playback — or a
 * resubscribe after the timer went idle — reads a live position instead of
 * re-anchoring the wall clock to a stale `streamPosition`. The ticker and its
 * store are paired singletons, so this holds no resource open beyond the store.
 */
export class ProgressTicker {
  private readonly store: TickerStoreView
  private readonly now: () => number

  private readonly subs = new Map<object, Subscriber>()
  private timer: ReturnType<typeof setInterval> | null = null
  private timerInterval = 0

  private anchorStatus: MediaStatus | null = null
  private anchorTime = 0

  constructor(store: TickerStoreView, now: () => number = Date.now) {
    this.store = store
    this.now = now
    // Lifetime-bound (never unsubscribed): keep the anchor resynced to the last
    // media-status push even while there are no listeners (see class doc). The
    // ticker and its store are paired singletons, so this leaks nothing.
    this.store.subscribe(() => this.onStoreChange())
    this.reanchor()
  }

  /**
   * Register a progress listener at a given update interval (seconds, default 1).
   * The listener is invoked on each shared tick while playing and whenever the
   * media slice changes (a new status push, pause/resume, or teardown). Returns
   * an unsubscribe.
   */
  subscribe(listener: Listener, interval = DEFAULT_INTERVAL): () => void {
    const safeInterval =
      interval > 0 && Number.isFinite(interval)
        ? Math.max(interval, MIN_INTERVAL)
        : DEFAULT_INTERVAL
    const key = {}
    this.subs.set(key, { listener, interval: safeInterval })
    this.reconcileTimer()
    return () => {
      if (!this.subs.delete(key)) return
      // The store subscription and anchor are lifetime-bound; only the shared
      // timer is reconciled (and stopped once the last listener leaves).
      this.reconcileTimer()
    }
  }

  /** Current derived position in seconds, or `null` when there is no media. */
  getPosition(): number | null {
    const status = this.status()
    if (!status) return null
    let pos = status.streamPosition
    if (status.playerState === 'playing' && status === this.anchorStatus) {
      pos +=
        ((this.now() - this.anchorTime) / 1000) * (status.playbackRate ?? 1)
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
    // The ticker observes the whole store; ignore churn that leaves the media
    // slice untouched (cast-state/device changes) so progress listeners only
    // fire on their own interval, never off an unrelated store write. A real
    // status push always yields a fresh `currentStatus` reference.
    const status = this.status()
    if (status === this.anchorStatus) return
    this.reanchor()
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
}

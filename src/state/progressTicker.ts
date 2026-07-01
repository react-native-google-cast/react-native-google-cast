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
  subscribe(_listener: Listener): () => void {
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
      pos +=
        ((this.now() - this.anchorTime) / 1000) * (status.playbackRate || 1)
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

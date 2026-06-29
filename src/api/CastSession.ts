import type { CastError, Device } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import type { StoreSession } from '../state/session.slice'

/** The store capability a session façade needs — just the live generation. */
type GenerationSource = Pick<CastStore, 'getCurrentGeneration'>

/**
 * A handle to a Cast session, created and memoized by {@link SessionManager}.
 *
 * Bound to the lifecycle **generation** at which its session became live. This
 * is what prevents the classic Cast use-after-free crash: a façade retained
 * across a disconnect is *stale*, and {@link assertActive} rejects with
 * `noSession` before any operation crosses the bridge — generation, not the
 * reused/absent `id`, is the identity (Invariant 3).
 *
 * Phase 3 scope is the guard itself: volume / mute / `getClient()` land in
 * Phase 5 and will each call {@link assertActive} first.
 */
export class CastSession {
  /** Unique session id (may be reused across sessions — do not use as identity). */
  readonly id: string
  /** The connected receiver device (a snapshot; valid even once stale). */
  readonly device: Device

  private readonly store: GenerationSource
  private readonly generation: number

  constructor(store: GenerationSource, session: StoreSession) {
    this.store = store
    this.generation = session.generation
    this.id = session.sessionId
    this.device = session.device
  }

  /** Whether this façade still refers to the current live session. */
  get isActive(): boolean {
    return this.store.getCurrentGeneration() === this.generation
  }

  /**
   * Guard that every bridge-crossing operation must call first. Throws a
   * {@link CastError} `noSession` the instant this façade is stale.
   */
  assertActive(): void {
    if (!this.isActive) {
      const error: CastError = {
        code: 'noSession',
        message: 'This Cast session has ended.',
      }
      throw error
    }
  }
}

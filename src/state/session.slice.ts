import type { Device, SessionInfo } from '../transport/types'
import type { Slice } from './slice'

export const SESSION_SLICE_KEY = 'session'

/**
 * The current live session as carried in the snapshot. Bound to a monotonic
 * lifecycle {@link generation}: the `CastSession` façade (Phase 3 T5) compares
 * its captured generation against the store's current generation before
 * crossing the bridge, rejecting `noSession` once stale (Invariant 3).
 */
export interface StoreSession {
  readonly sessionId: string
  readonly device: Device
  /** The lifecycle generation at which this session became live. */
  readonly generation: number
}

export interface SessionState {
  /** The live, operable session, or `null`. */
  readonly current: StoreSession | null
  /**
   * Monotonic generation. Incremented every time the live session is
   * established (`started`/`resumed`) or torn down (`ended`/`startFailed`/
   * `resumeFailed`/`suspended`) — never derived from `sessionId`, which is
   * unreliable (absent while starting, reused on resume, out-of-order).
   */
  readonly generation: number
}

/** Lifecycle events that bring a live, operable session into existence. */
const ESTABLISHES = new Set(['started', 'resumed'])
/** Lifecycle events that remove the live session. */
const TEARS_DOWN = new Set([
  'ended',
  'startFailed',
  'resumeFailed',
  'suspended',
])

function freezeSession(info: SessionInfo, generation: number): StoreSession {
  return Object.freeze({
    sessionId: info.sessionId,
    device: Object.freeze({ ...info.device }),
    generation,
  })
}

function seed(snapshot: { currentSession?: SessionInfo }): SessionState {
  // A session already live at cold start (already-casting) starts at gen 1, so
  // a façade bound to it is valid (current generation === its generation).
  if (snapshot.currentSession) {
    return { current: freezeSession(snapshot.currentSession, 1), generation: 1 }
  }
  return { current: null, generation: 0 }
}

/** Core slice: current session + lifecycle generation. */
export const sessionSlice: Slice<SessionState> = {
  key: SESSION_SLICE_KEY,

  seed,

  reduce: (state, event) => {
    if (event.kind !== 'lifecycle') return state
    const { type } = event.event

    if (ESTABLISHES.has(type)) {
      // A new live session (possibly replacing an existing one) — always a new
      // generation, so any façade from a prior session is stale.
      const nextGeneration = state.generation + 1
      const session = event.event.session
        ? freezeSession(event.event.session, nextGeneration)
        : null
      return { current: session, generation: nextGeneration }
    }

    if (TEARS_DOWN.has(type)) {
      // Only a real transition if a session was live; otherwise nothing to
      // invalidate (avoids spurious generation bumps / snapshot churn).
      if (state.current === null) return state
      return { current: null, generation: state.generation + 1 }
    }

    // starting / resuming / ending: no change in live-session presence.
    return state
  },
}

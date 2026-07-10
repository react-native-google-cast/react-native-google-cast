import type { Device, SessionInfo } from '../transport/types'
import type { ApplicationMetadata } from '../types/ApplicationMetadata'
import type { StandbyState } from '../types/StandbyState'
import type { ActiveInputState } from '../types/ActiveInputState'
import type { Slice } from './slice'

export const SESSION_SLICE_KEY = 'session'

/**
 * Resolved device detail of the live session (Phase 5), served synchronously to
 * the `CastSession` façade's `getVolume` / `isMute` / `getStandbyState` / … .
 *
 * Deliberately kept **separate** from {@link StoreSession} / {@link
 * SessionState.current}: `current` is what the snapshot exposes as
 * `currentSession` and must stay ref-stable across the frequent detail changes
 * (device volume ticks, standby flips), or `useCastSession` would re-render on
 * every one (Invariant 2). Detail is read via `getSliceState`, never through the
 * snapshot. Values are resolved (defaults applied) from the optional
 * {@link SessionInfo} detail fields native populates.
 */
export interface SessionDetail {
  readonly deviceVolume: number
  readonly deviceMuted: boolean
  readonly standbyState: StandbyState
  readonly activeInputState: ActiveInputState
  readonly applicationMetadata: ApplicationMetadata | null
  readonly applicationStatus: string | null
}

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
  /**
   * Device detail of the live session, or `null` when none is live. Tracks
   * `current` (set on establish, cleared on teardown) and is replaced wholesale
   * by the detail-change events. Kept off {@link current} to preserve its ref
   * across detail changes (Invariant 2).
   */
  readonly detail: SessionDetail | null
}

/**
 * Lifecycle events that bring a live, operable session into existence. Exported
 * (alongside {@link SESSION_TEARDOWN_TYPES}) so dependent slices track session
 * liveness off the same lists this slice uses, rather than keeping their own
 * copies that can silently drift.
 */
export const SESSION_ESTABLISH_TYPES = new Set(['started', 'resumed'])
/**
 * Lifecycle events that remove the live session. Exported so dependent slices
 * (e.g. the media slice, which must drop its cached status the instant the
 * session is gone) share this one list instead of keeping their own copy — the
 * two drifting apart is exactly the bug this prevents.
 */
export const SESSION_TEARDOWN_TYPES = new Set([
  'ended',
  'startFailed',
  'resumeFailed',
  'suspended',
])

/**
 * Lifecycle events carrying an updated device detail for the *current* live
 * session (Phase 5). They never change live-session presence or generation —
 * only {@link SessionState.detail}. Exported for the same anti-drift reason as
 * the establish/teardown lists.
 */
export const SESSION_DETAIL_CHANGE_TYPES = new Set([
  'deviceStatusChanged',
  'standbyStateChanged',
  'activeInputStateChanged',
])

function freezeSession(info: SessionInfo, generation: number): StoreSession {
  return Object.freeze({
    sessionId: info.sessionId,
    device: Object.freeze({ ...info.device }),
    generation,
  })
}

/** Resolve the optional {@link SessionInfo} detail fields, applying defaults. */
function freezeDetail(info: SessionInfo): SessionDetail {
  return Object.freeze({
    deviceVolume: info.deviceVolume ?? 0,
    deviceMuted: info.deviceMuted ?? false,
    standbyState: info.standbyState ?? 'unknown',
    activeInputState: info.activeInputState ?? 'unknown',
    applicationMetadata: info.applicationMetadata ?? null,
    applicationStatus: info.applicationStatus ?? null,
  })
}

function seed(snapshot: { currentSession?: SessionInfo }): SessionState {
  // A session already live at cold start (already-casting) starts at gen 1, so
  // a façade bound to it is valid (current generation === its generation).
  if (snapshot.currentSession) {
    return {
      current: freezeSession(snapshot.currentSession, 1),
      generation: 1,
      detail: freezeDetail(snapshot.currentSession),
    }
  }
  return { current: null, generation: 0, detail: null }
}

/** Core slice: current session + lifecycle generation + device detail. */
export const sessionSlice: Slice<SessionState> = {
  key: SESSION_SLICE_KEY,

  seed,

  reduce: (state, event) => {
    if (event.kind !== 'lifecycle') return state
    const { type } = event.event

    if (SESSION_ESTABLISH_TYPES.has(type)) {
      // A new live session (possibly replacing an existing one) — always a new
      // generation, so any façade from a prior session is stale. Detail is
      // seeded from the establishing session's payload.
      const nextGeneration = state.generation + 1
      const info = event.event.session
      const session = info ? freezeSession(info, nextGeneration) : null
      return {
        current: session,
        generation: nextGeneration,
        detail: info ? freezeDetail(info) : null,
      }
    }

    if (SESSION_TEARDOWN_TYPES.has(type)) {
      // Only a real transition if a session was live; otherwise nothing to
      // invalidate (avoids spurious generation bumps / snapshot churn).
      if (state.current === null) return state
      return { current: null, generation: state.generation + 1, detail: null }
    }

    if (SESSION_DETAIL_CHANGE_TYPES.has(type)) {
      // Detail update for the live session. Dropped when no session is live —
      // a detail change racing a teardown must not resurrect dead detail (the
      // same live-gating the media slice applies). `current` / `generation` are
      // preserved (same refs) so the snapshot's `currentSession` never churns.
      if (state.current === null || !event.event.session) return state
      return {
        current: state.current,
        generation: state.generation,
        detail: freezeDetail(event.event.session),
      }
    }

    // starting / resuming / ending: no change in live-session presence.
    return state
  },
}

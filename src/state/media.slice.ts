import type { MediaStatus } from '../types/MediaStatus'
import {
  SESSION_ESTABLISH_TYPES,
  SESSION_TEARDOWN_TYPES,
} from './session.slice'
import type { Slice } from './slice'

export const MEDIA_SLICE_KEY = 'media'

/**
 * The cached media status of the active session's RemoteMediaClient.
 *
 * `null` whenever there is no active session (or the session has not yet
 * reported a status). The {@link RemoteMediaClient} façade and the
 * `useMediaStatus` / `useStreamPosition` hooks read this slice synchronously.
 */
export interface MediaState {
  readonly currentStatus: MediaStatus | null
  /**
   * Whether a live session currently exists. Mirrors `session.current !== null`
   * — derived from the *same* lifecycle events and session payload the session
   * slice uses, so the two can never disagree. Gates status application: a
   * `mediaStatus` that races a teardown (e.g. Android `suspended → mediaStatus`)
   * is dropped rather than allowed to resurrect stale media (Invariant 3).
   */
  readonly live: boolean
}

const EMPTY_IDLE: MediaState = { currentStatus: null, live: false }
const EMPTY_LIVE: MediaState = { currentStatus: null, live: true }

/**
 * Core P4 slice: the streamed media status, bound to live-session presence.
 *
 * Status exists only while a session is live, so the slice:
 * - **accepts** a `mediaStatus` push only when `live` — a push arriving after
 *   teardown is dropped, never relying on a later lifecycle event to clean up;
 * - **clears** on session *establishment* (`started` / `resumed`) so a prior
 *   session's status can't bleed into the new generation; and
 * - **clears** on session *teardown* (`ended` / `startFailed` / `suspended` /
 *   `resumeFailed`) so a status can never outlive its session.
 *
 * `live` tracks `session.current` exactly — same events ({@link
 * SESSION_ESTABLISH_TYPES} / {@link SESSION_TEARDOWN_TYPES}) and the same
 * "establish carries a session" rule the session slice applies — so the two
 * lists can't drift (Invariant 3, media flavour).
 */
export const mediaSlice: Slice<MediaState> = {
  key: MEDIA_SLICE_KEY,

  // A fresh init never carries media status (cold-start status is a separate
  // deferred concern); only liveness is known up front.
  seed: (snapshot) => (snapshot.currentSession ? EMPTY_LIVE : EMPTY_IDLE),

  reduce: (state, event) => {
    if (event.kind === 'mediaStatus') {
      // Drop a status that arrives while no session is live — it would
      // otherwise resurrect media the session slice has already let go.
      if (!state.live) return state
      return { currentStatus: event.status, live: true }
    }

    if (event.kind === 'lifecycle') {
      const { type } = event.event
      if (SESSION_ESTABLISH_TYPES.has(type)) {
        // A new (or replacement) session: the prior status must not leak into
        // the new generation. `live` mirrors the session slice — an establish
        // event without a session payload yields no live session.
        const live = event.event.session != null
        const next = live ? EMPTY_LIVE : EMPTY_IDLE
        return state.currentStatus === null && state.live === live
          ? state
          : next
      }
      if (SESSION_TEARDOWN_TYPES.has(type)) {
        return state.currentStatus === null && !state.live ? state : EMPTY_IDLE
      }
    }

    return state
  },
}

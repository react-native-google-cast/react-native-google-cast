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
  /**
   * The `sessionId` of the live session this status belongs to (`null` when
   * none is live or the establish payload carried no usable id). Lets the
   * reducer tell a *re-announcement* of the session it already tracks — GCK's
   * delayed `started`/`resumed` for the session that was already current at
   * cold start, delivered after the snapshot seeded a status (native does not
   * re-emit: the media client is already observed) — from a real replacement:
   * the former keeps the seeded status (v5-az2), the latter clears it.
   */
  readonly sessionId: string | null
}

const EMPTY_IDLE: MediaState = {
  currentStatus: null,
  live: false,
  sessionId: null,
}
const emptyLive = (sessionId: string | null): MediaState => ({
  currentStatus: null,
  live: true,
  sessionId,
})

/** A non-empty sessionId from an establish payload, else `null` (unusable). */
const usableId = (sessionId: string | undefined): string | null =>
  sessionId ? sessionId : null

/**
 * Core P4 slice: the streamed media status, bound to live-session presence.
 *
 * Status exists only while a session is live, so the slice:
 * - **accepts** a `mediaStatus` push only when `live` — a push arriving after
 *   teardown is dropped, never relying on a later lifecycle event to clean up;
 * - **clears** on session *establishment* (`started` / `resumed`) of a
 *   **different** session so a prior session's status can't bleed into the new
 *   generation — but **keeps** it when the establish re-announces the same
 *   live session (the delayed cold-start `resumed`, see
 *   {@link MediaState.sessionId}); and
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

  // Cold start into an active cast (app relaunch during playback, or GCK
  // auto-resume completing before JS init): the snapshot may carry the live
  // session's media status, so hooks render playback state on mount instead
  // of waiting for the next native push. A status without a session is
  // dropped — same "no session, no media" rule the reducer applies (v5-az2).
  seed: (snapshot) =>
    snapshot.currentSession
      ? {
          currentStatus: snapshot.mediaStatus ?? null,
          live: true,
          sessionId: usableId(snapshot.currentSession.sessionId),
        }
      : EMPTY_IDLE,

  reduce: (state, event) => {
    if (event.kind === 'mediaStatus') {
      // Drop a status that arrives while no session is live — it would
      // otherwise resurrect media the session slice has already let go.
      if (!state.live) return state
      return {
        currentStatus: event.status,
        live: true,
        sessionId: state.sessionId,
      }
    }

    if (event.kind === 'lifecycle') {
      const { type } = event.event
      if (SESSION_ESTABLISH_TYPES.has(type)) {
        // `live` mirrors the session slice — an establish event without a
        // session payload yields no live session.
        const live = event.event.session != null
        const sessionId = usableId(event.event.session?.sessionId)
        // Re-announcement of the session already tracked (GCK's delayed
        // `resumed` after the cold-start seed, on both platforms): keep the
        // held status — clearing here would re-break v5-az2, and native will
        // not re-push (the media client was already observed at init).
        if (
          live &&
          state.live &&
          sessionId !== null &&
          sessionId === state.sessionId
        ) {
          return state
        }
        // A new (or replacement) session: the prior status must not leak into
        // the new generation.
        const next = live ? emptyLive(sessionId) : EMPTY_IDLE
        return state.currentStatus === null &&
          state.live === live &&
          state.sessionId === sessionId
          ? state
          : next
      }
      if (SESSION_TEARDOWN_TYPES.has(type)) {
        return state.currentStatus === null &&
          !state.live &&
          state.sessionId === null
          ? state
          : EMPTY_IDLE
      }
    }

    return state
  },
}

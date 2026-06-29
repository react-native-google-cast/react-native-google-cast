import type { MediaStatus } from '../types/MediaStatus'
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
}

const EMPTY: MediaState = { currentStatus: null }

/**
 * Core P4 slice: the streamed media status. Seeded empty (a fresh init never
 * carries media status — it only exists once a session is loading media), set
 * by the native `mediaStatus` push, and cleared the instant the session ends so
 * a stale status can never outlive its session (Invariant 3, media flavour).
 */
export const mediaSlice: Slice<MediaState> = {
  key: MEDIA_SLICE_KEY,

  seed: () => EMPTY,

  reduce: (state, event) => {
    if (event.kind === 'mediaStatus') {
      return { currentStatus: event.status }
    }
    if (event.kind === 'lifecycle') {
      // A status without a live session is a use-after-free waiting to happen.
      const { type } = event.event
      if (type === 'ended' || type === 'startFailed') {
        return state.currentStatus === null ? state : EMPTY
      }
    }
    return state
  },
}

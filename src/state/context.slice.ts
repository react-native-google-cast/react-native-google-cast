import type { CastState, PlayServicesState } from '../transport/types'
import type { Slice } from './slice'

export const CONTEXT_SLICE_KEY = 'context'

export interface ContextState {
  readonly castState: CastState
  readonly playServicesState: PlayServicesState
}

/**
 * Core slice: cast availability state + the Play-Services diagnostic.
 *
 * `playServicesState` is seeded from the initial snapshot and never mutated by a
 * runtime event in Phase 3 — but it is ALWAYS surfaced (even when the transport
 * is unavailable), because it is the diagnostic that explains *why* casting is
 * unavailable on Android.
 */
export const contextSlice: Slice<ContextState> = {
  key: CONTEXT_SLICE_KEY,

  seed: (snapshot) => ({
    castState: snapshot.castState,
    playServicesState: snapshot.playServicesState,
  }),

  reduce: (state, event) => {
    if (event.kind === 'state' && event.castState !== state.castState) {
      return {
        castState: event.castState,
        playServicesState: state.playServicesState,
      }
    }
    return state
  },
}

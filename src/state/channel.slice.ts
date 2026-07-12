import {
  SESSION_ESTABLISH_TYPES,
  SESSION_TEARDOWN_TYPES,
} from './session.slice'
import type { Slice } from './slice'

export const CHANNEL_SLICE_KEY = 'channel'

/** Connection status of one registered custom channel (see the platform note). */
export interface ChannelStatus {
  readonly connected: boolean
  readonly writable: boolean
}

/**
 * Per-namespace connection status of every registered custom channel (P5.2).
 *
 * Status is *state* (a component mounting mid-session must read the current
 * `connected`/`writable`), so it lives here and replays via the slice —
 * unlike inbound channel *messages*, which are transient and ride the store's
 * message bus, never a slice. An entry also doubles as the register-once
 * bookkeeping (T1): `CastSession.addChannel` rejects `alreadyRegistered` while
 * the namespace has an entry; `CastChannel.remove()` dispatches
 * `channelRemoved` to free it.
 *
 * Platform asymmetry (documented in the guide): iOS streams real dynamic
 * values; Android emits `{connected: true, writable: true}` once at
 * registration and never updates (its SDK has no per-channel callbacks).
 */
export interface ChannelState {
  readonly statuses: Readonly<Record<string, ChannelStatus>>
  /**
   * Whether a live session currently exists — same derivation as the media
   * slice's `live` (same event lists), gating status application so a
   * `channelStatus` racing a teardown is dropped (Invariant 3).
   */
  readonly live: boolean
}

const EMPTY_STATUSES: Readonly<Record<string, ChannelStatus>> = Object.freeze(
  {}
)
const EMPTY_IDLE: ChannelState = { statuses: EMPTY_STATUSES, live: false }
const EMPTY_LIVE: ChannelState = { statuses: EMPTY_STATUSES, live: true }

/**
 * P5.2 slice: custom-channel connection status, bound to live-session presence.
 * Channels never outlive their session: cleared on teardown (GCK auto-removes
 * them natively) and on establishment (a new session starts with none; the app
 * re-adds).
 */
export const channelSlice: Slice<ChannelState> = {
  key: CHANNEL_SLICE_KEY,

  seed: (snapshot) => (snapshot.currentSession ? EMPTY_LIVE : EMPTY_IDLE),

  reduce: (state, event) => {
    if (event.kind === 'channelStatus') {
      // Drop a status arriving while no session is live — it would resurrect
      // a channel the teardown already cleared (same gate as the media slice).
      if (!state.live) return state
      const prev = state.statuses[event.namespace]
      if (
        prev &&
        prev.connected === event.connected &&
        prev.writable === event.writable
      ) {
        return state
      }
      return {
        statuses: Object.freeze({
          ...state.statuses,
          [event.namespace]: Object.freeze({
            connected: event.connected,
            writable: event.writable,
          }),
        }),
        live: true,
      }
    }

    if (event.kind === 'channelRemoved') {
      if (!(event.namespace in state.statuses)) return state
      const { [event.namespace]: _removed, ...rest } = state.statuses
      return { statuses: Object.freeze(rest), live: state.live }
    }

    if (event.kind === 'lifecycle') {
      const { type } = event.event
      if (SESSION_ESTABLISH_TYPES.has(type)) {
        const live = event.event.session != null
        const empty = Object.keys(state.statuses).length === 0
        if (empty && state.live === live) return state
        return live ? EMPTY_LIVE : EMPTY_IDLE
      }
      if (SESSION_TEARDOWN_TYPES.has(type)) {
        return Object.keys(state.statuses).length === 0 && !state.live
          ? state
          : EMPTY_IDLE
      }
    }

    return state
  },
}

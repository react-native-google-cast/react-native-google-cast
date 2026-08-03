import { castStore } from '../state/castStore.singleton'
import { MEDIA_SLICE_KEY, type MediaState } from '../state/media.slice'
import { SESSION_SLICE_KEY, type SessionState } from '../state/session.slice'

/**
 * Store-internals readout for device debugging (v5-868 and friends).
 *
 * NOT part of the public API and NOT exported from the package barrel — same
 * status as `fakeSession.ts`. It exists because the public surface deliberately
 * cannot express the question a stale-status report actually poses:
 * `useMediaStatus()` returning a stale object is consistent with *three*
 * different faults, and the façade renders all three identically.
 *
 * The fields below split them:
 *
 * - `mediaPushes` frozen while the receiver visibly plays → native stopped
 *   calling JS. The fault is in the platform transport's media-client
 *   observer, not here.
 * - `mediaPushes` climbing but `live` false → the media slice's live gate is
 *   dropping every push (`media.slice.ts`: `if (!state.live) return state`).
 *   `hasSession` then says whether the two slices have disagreed, which they
 *   are built not to.
 * - `mediaPushes` climbing, `live` true, `streamPosition` frozen → the reducer
 *   is applying pushes that carry stale values; the fault is upstream of the
 *   boundary, in what native reads off the SDK.
 *
 * A note for anyone deep-importing this from an app, since it looks risky: this
 * module reaches the store through `castStore.singleton`, so a second module
 * instance would make it report a phantom store rather than the one the hooks
 * read. It does not — a device run confirmed the dump's `hasSession` /
 * `sessionId` matching what `useCastSession` rendered in the same frame. Metro
 * resolves the package's `react-native` entry (`src/index`) and a deep
 * `src/debug/...` path to the same realpath, so both land on one instance.
 */
export interface StoreDiagnostics {
  /** Pushes counted at the native→JS boundary, before the live gate. */
  readonly mediaPushes: number
  /** The media slice's live gate. */
  readonly live: boolean
  /** The session the media slice believes it is holding status for. */
  readonly mediaSessionId: string | null
  /** Whether the session slice holds a live session. */
  readonly hasSession: boolean
  readonly sessionId: string | null
  readonly generation: number
  readonly castState: string
  /** `null` when no status is cached. */
  readonly playerState: string | null
  readonly streamPosition: number | null
  readonly queueItemCount: number | null
}

/** Snapshot the store internals listed in {@link StoreDiagnostics}. */
export function dumpStoreDiagnostics(): StoreDiagnostics {
  const media = castStore.getSliceState<MediaState>(MEDIA_SLICE_KEY)
  const session = castStore.getSliceState<SessionState>(SESSION_SLICE_KEY)
  const snapshot = castStore.getSnapshot()
  const status = media.currentStatus
  return {
    mediaPushes: castStore.getMediaPushCount(),
    live: media.live,
    mediaSessionId: media.sessionId,
    hasSession: session.current !== null,
    sessionId: session.current?.sessionId ?? null,
    generation: session.generation,
    castState: snapshot.castState,
    playerState: status?.playerState ?? null,
    streamPosition: status?.streamPosition ?? null,
    queueItemCount: status?.queueItems.length ?? null,
  }
}

/** One-line form for the device event log. */
export function formatStoreDiagnostics(d: StoreDiagnostics): string {
  return (
    `pushes=${d.mediaPushes} live=${d.live} mediaSid=${d.mediaSessionId} ` +
    `session=${d.hasSession} sid=${d.sessionId} gen=${d.generation} ` +
    `castState=${d.castState} player=${d.playerState} pos=${d.streamPosition} ` +
    `queue=${d.queueItemCount}`
  )
}

import type { InitialSnapshot, SessionLifecycleEvent } from '../transport/types'
import type { CastState, Device } from '../transport/types'
import type { MediaStatus } from '../types/MediaStatus'

/**
 * Internal store event — the union of the native push sources fed through
 * {@link CastTransportApi.initAndSubscribe}. Later phases extend this union with
 * their own kinds and feed them via their own native HybridObject into
 * `CastStore.dispatch`.
 *
 * `mediaStatus` (P4) is the streamed `GCKMediaStatus` / `MediaStatus` of the
 * active session's RemoteMediaClient, pushed through the `onMediaStatus`
 * callback. A `null` status is a *clear*: the receiver reports no media (media
 * unloaded mid-session — `stop()`, or the last queue item removed) while the
 * session stays alive (v5-82w). There is no media status when no session is
 * live, so the media slice tracks session liveness (off the same lifecycle
 * events the session slice uses): it accepts a push only while a session is
 * live, and clears on both session establishment and teardown.
 */
export type StoreEvent =
  | { readonly kind: 'state'; readonly castState: CastState }
  | { readonly kind: 'devices'; readonly devices: Device[] }
  | { readonly kind: 'lifecycle'; readonly event: SessionLifecycleEvent }
  | { readonly kind: 'mediaStatus'; readonly status: MediaStatus | null }
  // P5.2 custom channels. Connection status is state (slice + snapshot-replay);
  // inbound channel *messages* are transient and deliberately NOT a StoreEvent —
  // they ride the store's namespace-keyed message bus and are never replayed.
  | {
      readonly kind: 'channelStatus'
      readonly namespace: string
      readonly connected: boolean
      readonly writable: boolean
    }
  // TS-only (dispatched by the CastChannel façade synchronously before the
  // bridge removeChannel call, T1): deletes the namespace's slice entry so
  // register-once bookkeeping frees the namespace for a later addChannel.
  | { readonly kind: 'channelRemoved'; readonly namespace: string }

/**
 * A registered piece of store state. Core slices (context / discovery / session)
 * register the same way Phase 4 (media) and Phase 5 (channels) will — each in
 * its own file, only the registration call site is shared.
 *
 * **Ref-stability contract (Invariant 2):** `reduce` MUST return the *exact same
 * state reference* when an event does not change the slice. Returning a fresh
 * (but equal) object every event would rebuild the snapshot and spin
 * `useSyncExternalStore` into an infinite render loop.
 */
export interface Slice<TState> {
  readonly key: string
  /** Seed from the atomic initial snapshot at init (and re-seed defaults pre-init). */
  seed(snapshot: InitialSnapshot): TState
  /** Reduce an event to the next state; return the same ref if unchanged. */
  reduce(state: TState, event: StoreEvent): TState
}

import type { InitialSnapshot, SessionLifecycleEvent } from '../transport/types'
import type { CastState, Device } from '../transport/types'

/**
 * Internal store event — the union of the three native push sources fed through
 * {@link CastTransportApi.initAndSubscribe}. Later phases extend this union with
 * their own kinds (media status in P4, channel messages in P5) and feed them via
 * their own native HybridObject into `CastStore.dispatch`.
 */
export type StoreEvent =
  | { readonly kind: 'state'; readonly castState: CastState }
  | { readonly kind: 'devices'; readonly devices: Device[] }
  | { readonly kind: 'lifecycle'; readonly event: SessionLifecycleEvent }

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

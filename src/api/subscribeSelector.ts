import type { CastSnapshot, CastStore } from '../state/CastStore'

/** v4-compatible listener handle: call `remove()` to stop listening. */
export interface EventSubscription {
  remove: () => void
}

/**
 * Subscribe to a single derived slice of the store snapshot, invoking the
 * listener only when that derived value's reference actually changes. The store
 * notifies on every state change; this narrows it back to one selector so a
 * `DiscoveryManager.onDevicesUpdated` consumer isn't woken by a cast-state
 * change (and vice versa). Relies on the store's referential stability
 * (Invariant 2): unchanged slices keep the same reference.
 */
export function subscribeSelector<T>(
  store: CastStore,
  select: (snapshot: CastSnapshot) => T,
  listener: (value: T) => void
): () => void {
  let previous = select(store.getSnapshot())
  return store.subscribe(() => {
    const next = select(store.getSnapshot())
    if (next !== previous) {
      previous = next
      listener(next)
    }
  })
}

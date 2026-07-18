/**
 * Generic keyed multi-handler event bus: subscribe by key, emit to that key's
 * handlers. Handlers are copied before invocation (copy-on-emit), so a handler
 * that unsubscribes itself — or another handler — mid-emit cannot corrupt the
 * iteration.
 *
 * Backs both of the store's never-replayed event paths: the typed session
 * lifecycle bus (`CastStore.on`) and the Phase 5 per-namespace channel message
 * bus (`CastStore.onChannelMessage`). State replay is `getSnapshot`'s job —
 * nothing emitted through a bus is ever replayed to a late subscriber.
 *
 * Handlers are stored in a per-key `Set`, so subscribing the **same function
 * reference** to the same key twice collapses to a single entry — and a single
 * unsubscribe then drops it entirely. No current caller does this (each
 * subscriber passes a fresh closure); if you need duplicate handlers on one
 * key, wrap each in its own closure.
 */
export class KeyedBus<K, V> {
  private readonly handlers = new Map<K, Set<(value: V) => void>>()

  /** Subscribe to `key`; returns the unsubscribe function. */
  subscribe(key: K, handler: (value: V) => void): () => void {
    let set = this.handlers.get(key)
    if (!set) {
      set = new Set()
      this.handlers.set(key, set)
    }
    set.add(handler)
    return () => {
      set.delete(handler)
      // Prune the key's entry once its last handler is gone, so long-lived
      // buses keyed by unbounded values (channel namespaces) don't accumulate
      // empty Sets. Guard on identity: a stale double-unsubscribe must not
      // drop a successor Set created for the same key in the meantime.
      if (set.size === 0 && this.handlers.get(key) === set) {
        this.handlers.delete(key)
      }
    }
  }

  /** Emit `value` to every handler subscribed to `key` (copy-on-emit). */
  emit(key: K, value: V): void {
    const set = this.handlers.get(key)
    if (!set) return
    for (const handler of [...set]) handler(value)
  }

  /** Drop every handler (store dispose). */
  clear(): void {
    this.handlers.clear()
  }
}

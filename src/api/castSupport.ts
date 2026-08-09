import { castStore } from '../state/castStore.singleton'

/**
 * Whether this platform can cast at all — the native answer.
 *
 * On Android this is Google Play Services: a device without it (a GMS-less
 * build, a Fire tablet, some Android TV boxes) cannot cast no matter what the
 * app does. `playServicesState` is seeded from the initial snapshot and never
 * mutated afterwards, so this is effectively constant for the process lifetime,
 * but it is still read through the store so the value cannot go stale.
 *
 * On iOS GCK is linked into the binary, so casting is always supported and this
 * is always `true` — `playServicesState` is documented as `'success'` there.
 *
 * The web answer lives in `castSupport.web.ts`, where it is genuinely dynamic.
 */
export function getCastSupported(): boolean {
  return castStore.getSnapshot().playServicesState === 'success'
}

/**
 * Subscribe to changes in {@link getCastSupported}.
 *
 * Native availability does not change after init, but this is subscribed the
 * same way as the web implementation so `useCastSupported` is one code path on
 * every platform.
 */
export function subscribeCastSupported(listener: () => void): () => void {
  return castStore.subscribe(listener)
}

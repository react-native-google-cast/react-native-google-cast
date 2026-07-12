import { useSyncExternalStore } from 'react'
import type { CastState } from '../transport/types'
import { castStore } from '../state/castStore.singleton'

/**
 * Hook that provides the current {@link CastState}, re-rendering whenever it
 * changes.
 *
 * Migration note (v4 → v5): v4 returned `null` until its async initialization
 * completed; v5's store seeds synchronously, so this always returns a
 * `CastState`. During the brief native-init window v5 reports
 * `noDevicesAvailable` where v4 reported `null`.
 *
 * @example
 * ```js
 * import { useCastState } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castState = useCastState()
 *   // 'noDevicesAvailable' | 'notConnected' | 'connecting' | 'connected'
 * }
 * ```
 */
export function useCastState(): CastState {
  return useSyncExternalStore(
    castStore.subscribe,
    () => castStore.getSnapshot().castState
  )
}

import { useSyncExternalStore } from 'react'
import type { Device } from '../transport/types'
import { castStore } from '../state/castStore.singleton'
import { useCastSession } from './useCastSession'
import type { UseCastSessionOptions } from './useCastSession'

/**
 * Hook that provides the {@link Device} the current session is connected to,
 * or `null` when no session is connected.
 *
 * Delegates session presence to {@link useCastSession} (v4 parity), so the
 * same options apply: with `ignoreSessionUpdatesInBackground` the device stays
 * visible while the session is suspended.
 *
 * The device is read through the returned façade's own `CastSession.device`
 * getter — generation-scoped, so it is always *that* session's device (a
 * retained suspended façade keeps its own last-known device even if another
 * session appears in the store), never an unscoped store read that could pair
 * one session with another session's device. The store subscription is what
 * re-renders on a mid-session device update (e.g. a receiver rename): the
 * façade reference is memoized per generation and never changes for one. The
 * device reference is ref-stable and swaps only when the device data actually
 * changes.
 *
 * @example
 * ```js
 * import { useCastDevice } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castDevice = useCastDevice()
 *   // castDevice?.friendlyName
 * }
 * ```
 */
export function useCastDevice(options?: UseCastSessionOptions): Device | null {
  const castSession = useCastSession(options)
  return useSyncExternalStore(
    castStore.subscribe,
    () => castSession?.device ?? null
  )
}

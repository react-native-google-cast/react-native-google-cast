import { useSyncExternalStore } from 'react'
import type { Device } from '../transport/types'
import { castStore } from '../state/castStore.singleton'
import { SESSION_SLICE_KEY, type SessionState } from '../state/session.slice'
import { useCastSession } from './useCastSession'
import type { UseCastSessionOptions } from './useCastSession'

/**
 * Hook that provides the {@link Device} the current session is connected to,
 * or `null` when no session is connected.
 *
 * Delegates session presence to {@link useCastSession} (v4 parity), so the
 * same options apply: with `ignoreSessionUpdatesInBackground` the device stays
 * visible while the session is suspended. The device value itself is
 * subscribed **directly from the session slice**: the `CastSession` façade is
 * memoized per generation, so a mid-session device update (e.g. a receiver
 * rename) never changes the façade reference — only the slice re-render can
 * surface it. The reference is ref-stable across unrelated detail changes and
 * swaps only when the device data actually changes.
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
  const liveDevice = useSyncExternalStore(
    castStore.subscribe,
    () =>
      castStore.getSliceState<SessionState>(SESSION_SLICE_KEY).current
        ?.device ?? null
  )
  if (!castSession) return null
  // Suspended-with-retained path: the slice's `current` is torn down, so fall
  // back to the retained façade's last-known device.
  return liveDevice ?? castSession.device
}

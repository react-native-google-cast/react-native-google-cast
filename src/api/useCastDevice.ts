import type { Device } from '../transport/types'
import { useCastSession } from './useCastSession'
import type { UseCastSessionOptions } from './useCastSession'

/**
 * Hook that provides the {@link Device} the current session is connected to,
 * or `null` when no session is connected.
 *
 * Delegates to {@link useCastSession} (v4 parity), so the same options apply:
 * with `ignoreSessionUpdatesInBackground` the device stays visible while the
 * session is suspended. The device reference is frozen per session and
 * ref-stable for the session's lifetime.
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
  return castSession?.device ?? null
}

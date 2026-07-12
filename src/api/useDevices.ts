import { useSyncExternalStore } from 'react'
import type { Device } from '../transport/types'
import { castStore } from '../state/castStore.singleton'

/**
 * Hook that provides the list of {@link Device}s currently available for
 * casting, re-rendering when the list changes.
 *
 * The array is frozen and referentially stable while the list is unchanged,
 * so it is safe to use directly in dependency arrays.
 *
 * @example
 * ```js
 * import GoogleCast, { useDevices } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const devices = useDevices()
 *   return devices.map((device) => (
 *     <Button
 *       key={device.deviceId}
 *       onPress={() =>
 *         GoogleCast.getSessionManager().startSession(device.deviceId)
 *       }
 *       title={device.friendlyName}
 *     />
 *   ))
 * }
 * ```
 */
export function useDevices(): readonly Device[] {
  return useSyncExternalStore(
    castStore.subscribe,
    () => castStore.getSnapshot().devices
  )
}

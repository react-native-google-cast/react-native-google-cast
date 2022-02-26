import { useEffect, useState } from 'react'
import Device from '../types/Device'
import useCastSession, { UseCastSessionOptions } from './useCastSession'

/**
 * Hook that provides the currently connected {@link Device}.
 *
 * @returns current device, or `null` if there's no session connected
 * @example
 * ```js
 * import { useCastDevice } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castDevice = useCastDevice()
 *
 *   if (castDevice) {
 *     console.log(castDevice)
 *   }
 * }
 * ```
 */

export default function useCastDevice(
  options?: UseCastSessionOptions
): Device | null {
  const [device, setDevice] = useState<Device | null>(null)
  const session = useCastSession(options)

  useEffect(() => {
    if (!session) setDevice(null)
    else session.getCastDevice().then(setDevice)
  }, [session])

  return device
}

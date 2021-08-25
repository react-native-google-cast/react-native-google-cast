import Device from '../types/Device';
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
export default function useCastDevice(): Device | null;

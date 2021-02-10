import CastChannel from './CastChannel';
/**
 * Hook that establishes a custom {@link CastChannel} on the current connected session.
 *
 * @param namespace custom namespace starting with `urn:x-cast:`
 * @param onMessage listener called when a message from the receiver was received
 * @returns custom channel, or `null` if there's no session connected
 * @example
 * ```js
 * import { useCastChannel } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castChannel = useCastChannel(
 *     'urn:x-cast:com.example.custom',
 *     useCallback(message => { console.log('Received message', message) }, [])
 *   )
 *
 *   // later, for example after pressing a button
 *   function onPress() {
 *     if (castChannel) {
 *       castChannel.sendMessage('...')
 *     }
 *   }
 * }
 * ```
 */
export default function useCastChannel(namespace: string, onMessage?: (message: Record<string, any> | string) => void): CastChannel | null;

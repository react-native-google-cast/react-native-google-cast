import useCastSession from './useCastSession';
/**
 * Hook that provides the current {@link RemoteMediaClient}.
 *
 * @returns current client, or `null` if there's no session connected
 * @example
 * ```js
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   if (client) {
 *     client.loadMedia(...)
 *   }
 * }
 * ```
 */

export default function useRemoteMediaClient() {
  const castSession = useCastSession();
  return castSession ? castSession.client : null;
}
//# sourceMappingURL=useRemoteMediaClient.js.map
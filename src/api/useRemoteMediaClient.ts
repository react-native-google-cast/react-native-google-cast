import useCastSession, { UseCastSessionOptions } from './useCastSession'

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
export default function useRemoteMediaClient(options?: UseCastSessionOptions) {
  const castSession = useCastSession(options)
  return castSession ? castSession.client : null
}

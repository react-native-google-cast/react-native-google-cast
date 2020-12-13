import useCastSession from './useCastSession'

/**
 * Hook that provides the current {@link RemoteMediaClient} (may be `null`).
 *
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
  const castSession = useCastSession()
  return castSession ? castSession.client : null
}

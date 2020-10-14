import useCastSession from './useCastSession'

/**
 * Hook that provides the current RemoteMediaClient (may be `null`).
 *
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   client.loadMedia(...)
 * }
 * ```
 */
export default function useRemoteMediaClient() {
  const castSession = useCastSession()
  return castSession ? castSession.client : null
}

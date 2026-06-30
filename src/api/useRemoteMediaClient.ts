import { useSyncExternalStore } from 'react'
import { castStore, castTransport } from '../state/castStore.singleton'
import { RemoteMediaClient } from './RemoteMediaClient'

/**
 * Hook that provides the current {@link RemoteMediaClient}.
 *
 * Re-renders when the session changes: the same client reference is returned for
 * the lifetime of a session (memoized per generation), then a fresh one once a
 * new session starts, and `null` while there is none.
 *
 * @returns the current client, or `null` if there is no session connected.
 *
 * @example
 * ```ts
 * import { useEffect } from 'react'
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *
 *   useEffect(() => {
 *     client?.loadMedia({ mediaInfo: { contentUrl: '…' } })
 *   }, [client])
 * }
 * ```
 */
export function useRemoteMediaClient(): RemoteMediaClient | null {
  return useSyncExternalStore(castStore.subscribe, () =>
    RemoteMediaClient.current(castStore, castTransport)
  )
}

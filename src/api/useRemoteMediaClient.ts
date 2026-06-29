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
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *   client?.loadMedia({ mediaInfo: { contentUrl: '…' } })
 * }
 * ```
 */
export function useRemoteMediaClient(): RemoteMediaClient | null {
  return useSyncExternalStore(castStore.subscribe, () =>
    RemoteMediaClient.current(castStore, castTransport)
  )
}

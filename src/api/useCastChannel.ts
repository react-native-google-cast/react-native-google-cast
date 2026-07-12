import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { CastContext } from './CastContext'
import type { CastChannel } from './CastChannel'

/**
 * Hook that establishes a custom {@link CastChannel} on the current session.
 *
 * The channel is added when a session is live, removed on unmount and when the
 * session or `namespace` changes, and re-created on the next session. The hook
 * owns the channel's **single** message listener (replace-on-set, v4 parity):
 * it installs a forwarder at `addChannel` time — *before* the channel is
 * exposed, so an initial message from the receiver is never dropped — that
 * always invokes the latest `onMessage` (identity changes take effect without
 * re-registering the channel). Do not also call `channel.onMessage` elsewhere,
 * or the two will clobber each other.
 *
 * Note that a namespace can only be registered once at a time. To use a
 * channel from multiple screens, lift the hook to a common parent (or manage
 * the channel in a global store) — see the Custom Channels guide.
 *
 * @param namespace custom namespace starting with `urn:x-cast:`.
 * @param onMessage listener invoked with each raw message string received.
 * @returns the channel, or `null` while there is no session (or during setup).
 *
 * @example
 * ```js
 * import { useCastChannel } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const channel = useCastChannel(
 *     'urn:x-cast:com.example.custom',
 *     useCallback((message) => console.log('received', message), [])
 *   )
 *   // later: channel?.sendMessage({ hello: 'world' })
 * }
 * ```
 */
export function useCastChannel(
  namespace: string,
  onMessage?: (message: string) => void
): CastChannel | null {
  // Memoized per generation by SessionManager → ref-stable across re-renders,
  // changes exactly when the session changes.
  const castSession = useSyncExternalStore(castStore.subscribe, () =>
    CastContext.getSessionManager().getCurrentCastSession()
  )
  const [channel, setChannel] = useState<CastChannel | null>(null)
  // Latest-ref for the listener: the forwarder installed at addChannel time
  // always calls the current `onMessage`, so a changed handler needs no
  // re-registration and an initial message can't slip through unheard.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!castSession) {
      setChannel(null)
      return
    }
    let active = true
    let created: CastChannel | null = null
    castSession
      .addChannel(namespace, (message) => onMessageRef.current?.(message))
      .then((c) => {
        if (active) {
          created = c
          setChannel(c)
        } else {
          // Unmounted while adding — undo immediately.
          void c.remove().catch(() => {})
        }
      })
      .catch(() => {
        // Session ended mid-add, or the namespace is registered elsewhere
        // (register-once — see the guide's lift-to-parent note).
        if (active) setChannel(null)
      })
    return () => {
      active = false
      setChannel(null)
      // `remove()` frees the namespace synchronously (T1), so a remount /
      // namespace change can re-add immediately without self-colliding. It
      // rejects noSession once the session already ended (native auto-removed
      // the channel with it) — safe to swallow.
      void created?.remove().catch(() => {})
    }
  }, [castSession, namespace])

  return channel
}

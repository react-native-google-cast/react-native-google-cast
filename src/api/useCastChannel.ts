import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { CHANNEL_SLICE_KEY, type ChannelState } from '../state/channel.slice'
import type { CastError } from '../transport/types'
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
 * Note that a namespace can only be registered once at a time. If the
 * namespace is currently registered elsewhere — including by a predecessor of
 * this very hook whose in-flight registration a fast remount raced — the hook
 * returns `null` and **waits**: it registers the channel as soon as the
 * namespace frees, instead of failing permanently. To use a channel from
 * multiple screens at once, lift the hook to a common parent (or manage the
 * channel in a global store) — see the Custom Channels guide.
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
    let unwatch: (() => void) | null = null

    const namespaceFree = () =>
      castStore.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
        namespace
      ] === undefined

    const attempt = () => {
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
        .catch((error: unknown) => {
          // Session ended mid-add, or the namespace is registered elsewhere
          // (register-once). The latter can be transient: a fast remount races
          // the predecessor's in-flight registration — its initial
          // channelStatus already holds the slice entry, but its deferred
          // cleanup `remove()` can only run once that registration resolves.
          // So on alreadyRegistered we don't give up: wait for the namespace
          // to free (predecessor removal, another screen releasing it, or
          // session teardown clearing the slice) and register then.
          if (!active) return
          setChannel(null)
          if ((error as CastError | null)?.code === 'alreadyRegistered') {
            waitForNamespace()
          }
        })
    }

    const waitForNamespace = () => {
      if (namespaceFree()) {
        // Already freed by the time the rejection settled. Safe to re-add
        // right away: the freeing `remove()` dispatches `channelRemoved` and
        // issues its native removeChannel back-to-back synchronously, so the
        // bridge has the remove before this add.
        attempt()
        return
      }
      unwatch = castStore.subscribe(() => {
        if (!active || !namespaceFree()) return
        unwatch?.()
        unwatch = null
        // Defer a microtask: this callback fires synchronously from the
        // `channelRemoved` dispatch inside `CastChannel.remove()`, i.e.
        // BEFORE its native removeChannel call. Re-adding synchronously here
        // would issue addChannel first and the trailing remove would then
        // tear down the fresh native channel (T1 ordering inversion).
        void Promise.resolve().then(() => {
          if (active) attempt()
        })
      })
    }

    attempt()
    return () => {
      active = false
      unwatch?.()
      unwatch = null
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

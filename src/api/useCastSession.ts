import { useEffect, useState, useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { CastContext } from './CastContext'
import type { CastSession } from './CastSession'

export interface UseCastSessionOptions {
  /**
   * Keep returning the last session while it is **suspended** (e.g. the app
   * was backgrounded on iOS), instead of `null`. Best-effort v4 parity:
   *
   * - The retained façade is **inert while suspended** — mutations reject a
   *   `CastError` `noSession` (materially the same as v4, whose retained
   *   object also failed natively during suspension). Use it for rendering
   *   ("still connected to X"), not for calls.
   * - On `resumed` the hook always hands out the **fresh** generation-bound
   *   façade — a **new object reference**, even for the same session. Key
   *   effects on `castSession?.id` (stable across suspend/resume of the same
   *   session), not on the object identity.
   */
  ignoreSessionUpdatesInBackground?: boolean
}

/**
 * Hook that provides the current {@link CastSession}, or `null` when no
 * session is connected.
 *
 * The same session reference is returned for the lifetime of a session
 * (memoized per generation), then a fresh one once a new session starts.
 * By default a **suspended** session reads as `null` until it resumes; see
 * {@link UseCastSessionOptions.ignoreSessionUpdatesInBackground} to keep the
 * last session visible across a suspension (and its caveats).
 *
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castSession = useCastSession()
 *
 *   useEffect(() => {
 *     // key effects on the id, not the object (fresh reference on resume)
 *   }, [castSession?.id])
 * }
 * ```
 */
export function useCastSession(
  options?: UseCastSessionOptions
): CastSession | null {
  const ignoreInBackground = options?.ignoreSessionUpdatesInBackground === true

  // Default path (E4): a plain, race-free store read — the memoized façade
  // tracks the snapshot, so `suspended` (which tears the session down) nulls.
  const live = useSyncExternalStore(castStore.subscribe, () =>
    CastContext.getSessionManager().getCurrentCastSession()
  )

  // Event path, in effect only with `ignoreSessionUpdatesInBackground`:
  // driven by the SessionManager lifecycle events, with `suspended`
  // deliberately NOT nulling the retained façade.
  const [retained, setRetained] = useState<CastSession | null>(null)

  useEffect(() => {
    if (!ignoreInBackground) return

    const sessionManager = CastContext.getSessionManager()
    // The handlers receive the post-event `getCurrentCastSession()`: the fresh
    // façade for started/resumed, `null` for the teardown events.
    const subscriptions = [
      sessionManager.onSessionStarted(setRetained),
      sessionManager.onSessionResumed(setRetained),
      sessionManager.onSessionEnded(setRetained),
      sessionManager.onSessionStartFailed(setRetained),
      sessionManager.onSessionResumeFailed(setRetained),
      // `suspended` intentionally unhandled — that's the whole option.
    ]
    // Subscribe FIRST, then re-read synchronously: an event landing between
    // render and this effect is now either caught by a subscription or
    // reflected in this read — the mount gap is closed (E4).
    setRetained(sessionManager.getCurrentCastSession())

    return () => {
      for (const subscription of subscriptions) subscription.remove()
      setRetained(null)
    }
  }, [ignoreInBackground])

  return ignoreInBackground ? retained : live
}

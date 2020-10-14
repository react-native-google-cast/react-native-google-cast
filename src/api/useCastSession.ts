import { useEffect, useState } from 'react'
import CastSession from './CastSession'
import SessionManager from './SessionManager'

/**
 * Hook that provides the current {@link CastSession} (may be `null`).
 *
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castSession = useCastSession()
 *
 *   if (castSession) {
 *     castSession.client.loadMedia(...)
 *   }
 * }
 * ```
 */

export default function useCastSession() {
  const [castSession, setCastSession] = useState<CastSession | null>(null)

  useEffect(() => {
    manager.getCurrentCastSession().then(setCastSession)

    const started = manager.onSessionStarted(setCastSession)
    const suspended = manager.onSessionSuspended(() => setCastSession(null))
    const resumed = manager.onSessionResumed(setCastSession)
    const ending = manager.onSessionEnding(() => setCastSession(null))

    return () => {
      started.remove()
      suspended.remove()
      resumed.remove()
      ending.remove()
    }
  }, [])

  return castSession
}

const manager = new SessionManager()

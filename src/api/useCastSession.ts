import { useEffect, useState } from 'react'
import CastSession from './CastSession'
import SessionManager from './SessionManager'

/**
 * Hook that provides the current {@link CastSession}.
 *
 * @returns current session, or `null` if there's no session connected
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

export default function useCastSession(): CastSession | null {
  const [castSession, setCastSession] = useState<CastSession | null>(null)

  useEffect(() => {
    manager.getCurrentCastSession().then(setCastSession)

    const started = manager.onSessionStarted(setCastSession)
    const resumed = manager.onSessionResumed(setCastSession)
    const ended = manager.onSessionEnded(() => setCastSession(null))

    return () => {
      started.remove()
      resumed.remove()
      ended.remove()
    }
  }, [])

  return castSession
}

const manager = new SessionManager()

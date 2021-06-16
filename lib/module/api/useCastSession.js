import { useEffect, useState } from 'react';
import SessionManager from './SessionManager';
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

export default function useCastSession() {
  const [castSession, setCastSession] = useState(null);
  useEffect(() => {
    manager.getCurrentCastSession().then(setCastSession);
    const started = manager.onSessionStarted(setCastSession);
    const resumed = manager.onSessionResumed(setCastSession);
    const ended = manager.onSessionEnded(() => setCastSession(null));
    return () => {
      started.remove();
      resumed.remove();
      ended.remove();
    };
  }, []);
  return castSession;
}
const manager = new SessionManager();
//# sourceMappingURL=useCastSession.js.map
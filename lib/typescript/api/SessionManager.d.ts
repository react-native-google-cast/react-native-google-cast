import CastSession from './CastSession';
/**
 * A class that manages sessions.
 *
 * A session can be created in two ways:
 *
 * 1. A user opens the Cast dialog by pressing the [CastButton](../../components/CastButton) and selects a device to cast to. An instance of {@link CastSession} is created automatically by the SessionManager.
 *
 * 2. A session is created manually by calling {@link SessionManager.startSession} _(This is not implemented yet)_
 *
 * SessionManager handles automatic resumption of suspended sessions (that is, resuming sessions that were ended when the application went to the background, or in the event that the application crashed or was forcibly terminated by the user). When the application resumes or restarts, the session manager will wait for a short time for the device provider of the suspended session's device to discover that device again, and if it does, it will attempt to reconnect to that device and re-establish the session automatically.
 *
 * Whether or not the application uses the SessionManager to control sessions, it can attach listeners to be notified of session events, such as {@link onSessionStarted} or {@link onSessionEnded}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/SessionManager) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session_manager)
 *
 * @example
 * ```js
 * import GoogleCast from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const sessionManager = GoogleCast.getSessionManager()
 * }
 * ```
 */
export default class SessionManager {
    /**
     * End current session. This disconnects the sender from the receiver but the receiver will continue playing (unless `stopCasting` is set to `true`).
     *
     * @param stopCasting Should the receiver application be stopped?
     */
    endCurrentSession(stopCasting?: boolean): Promise<void>;
    getCurrentCastSession(): Promise<CastSession | null>;
    /** Called when a session is about to be started. */
    onSessionStarting(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    /** Called when a session has been successfully started. */
    onSessionStarted(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    /** Called when a session has failed to start. */
    onSessionStartFailed(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    onSessionSuspended(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    onSessionResuming(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    onSessionResumed(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    /** Called when a session is about to be ended, either by request or due to an error. */
    onSessionEnding(handler: (session: CastSession) => void): import("react-native").EmitterSubscription;
    /** Called when a session has ended, either by request or due to an error. */
    onSessionEnded(handler: (session: CastSession, error?: string) => void): import("react-native").EmitterSubscription;
}

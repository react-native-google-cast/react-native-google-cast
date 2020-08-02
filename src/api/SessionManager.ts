import { NativeEventEmitter, NativeModules } from 'react-native'
import type CastSession from './CastSession'

const { RNGCSessionManager: Native } = NativeModules
const EventEmitter = new NativeEventEmitter(Native)

//  * The method {@link SessionManager.startSession} is used to create a new session with a given {@link Device}. The session manager uses the DeviceProvider for that device type to construct a new {@link Session} object, to which it then delegates all session requests.
// * If the application has created a [CastButton](../../components/CastButton) without providing a target and selector, then a user tap on the button will display the default Cast dialog and it will automatically start and stop sessions based on user selection or disconnection of a device. If however the application is providing its own device selection/control dialog UI, then it should use the SessionManager directly to create and control sessions.

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
 */
export default class SessionManager {
  getCurrentCastSession(): Promise<CastSession> {
    return Native.getCurrentCastSession()
  }

  /** Called when a session is about to be started. */
  onSessionStarting(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_STARTING, handler)
  }

  /** Called when a session has been successfully started. */
  onSessionStarted(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_STARTED, handler)
  }

  /** Called when a session has failed to start. */
  onSessionStartFailed(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_START_FAILED, handler)
  }

  onSessionSuspended(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_SUSPENDED, handler)
  }

  onSessionResuming(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_RESUMING, handler)
  }

  onSessionResumed(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_RESUMED, handler)
  }

  /** Called when a session is about to be ended, either by request or due to an error. */
  onSessionEnding(handler: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_ENDING, handler)
  }

  /** Called when a session has ended, either by request or due to an error. */
  onSessionEnded(handler: (session: CastSession, error?: string) => void) {
    return EventEmitter.addListener(Native.SESSION_ENDED, handler)
  }
}

import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'
import CastSession from './CastSession'

const { RNGCCastContext: Native } = NativeModules

// TODO use the same native event interface instead of hacking it here
const EventEmitter =
  Platform.OS === 'ios' ? new NativeEventEmitter(Native) : DeviceEventEmitter

/**
 * A class that manages sessions.
 *
 * The method startSessionWithDevice: (GCKSessionManager) is used to create a new session with a given GCKDevice. The session manager uses the GCKDeviceProvider for that device type to construct a new GCKSession object, to which it then delegates all session requests.
 *
 * GCKSessionManager handles the automatic resumption of suspended sessions (that is, resuming sessions that were ended when the application went to the background, or in the event that the application crashed or was forcibly terminated by the user). When the application resumes or restarts, the session manager will wait for a short time for the device provider of the suspended session's device to discover that device again, and if it does, it will attempt to reconnect to that device and re-establish the session automatically.
 *
 * If the application has created a GCKUICastButton without providing a target and selector, then a user tap on the button will display the default Cast dialog and it will automatically start and stop sessions based on user selection or disconnection of a device. If however the application is providing its own device selection/control dialog UI, then it should use the GCKSessionManager directly to create and control sessions.
 *
 * Whether or not the application uses the GCKSessionManager to control sessions, it can attach a GCKSessionManagerListener to be notified of session events, and can also use KVO to monitor the connectionState property to track the current session lifecycle state.
 *
 * @see [Android]{@link https://developers.google.com/android/reference/com/google/android/gms/cast/framework/SessionManager} | [iOS]{@link https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_session_manager} | [Chrome]{@link https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer}
 */
export default class SessionManager {
  getCurrentCastSession(): Promise<CastSession> {
    return Native.getCurrentCastSession()
  }

  /** Called when a session is about to be started. */
  onSessionStarting(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_STARTING, listener)
  }

  /** Called when a session has been successfully started. */
  onSessionStarted(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_STARTED, listener)
  }

  /** Called when a session has failed to start. */
  onSessionStartFailed(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_START_FAILED, listener)
  }

  onSessionSuspended(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_SUSPENDED, listener)
  }

  onSessionResuming(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_RESUMING, listener)
  }

  onSessionResumed(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_RESUMED, listener)
  }

  /** Called when a session is about to be ended, either by request or due to an error. */
  onSessionEnding(listener: (session: CastSession) => void) {
    return EventEmitter.addListener(Native.SESSION_ENDING, listener)
  }

  /** Called when a session has ended, either by request or due to an error. */
  onSessionEnded(listener: (session: CastSession, error?: string) => void) {
    return EventEmitter.addListener(Native.SESSION_ENDED, listener)
  }
}

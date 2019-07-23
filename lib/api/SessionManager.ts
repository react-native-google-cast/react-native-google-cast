import { NativeModules } from 'react-native'
import CastSession from './CastSession'

const { RNGCSessionManager: Native } = NativeModules

// TODO use the same native event interface instead of hacking it here
// EventEmitter:
//   Platform.OS === 'ios'
//     ? new NativeEventEmitter(GoogleCast)
//     : DeviceEventEmitter

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
  static readonly SESSION_STARTING = Native.SESSION_STARTING
  static readonly SESSION_STARTED = Native.SESSION_STARTED
  static readonly SESSION_START_FAILED = Native.SESSION_START_FAILED
  static readonly SESSION_SUSPENDED = Native.SESSION_SUSPENDED
  static readonly SESSION_RESUMING = Native.SESSION_RESUMING
  static readonly SESSION_RESUMED = Native.SESSION_RESUMED
  static readonly SESSION_ENDING = Native.SESSION_ENDING
  static readonly SESSION_ENDED = Native.SESSION_ENDED

  addListener() {}

  getCurrentCastSession(): Promise<CastSession> {
    return Native.getCurrentCastSession()
  }
}

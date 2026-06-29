// Public entry point for react-native-google-cast v5.
// Barrel file: re-exports only (no implementation logic).

import { CastContext } from './api/CastContext'

// `GoogleCast` (default) and `CastContext` are equivalent (v4 parity).
export default CastContext
export { CastContext }
export { DiscoveryManager } from './api/DiscoveryManager'
export { SessionManager } from './api/SessionManager'
export { CastSession } from './api/CastSession'
export type { SessionEventHandler } from './api/SessionManager'
export type { EventSubscription } from './api/subscribeSelector'

export type {
  CastTransportApi,
  CastState,
  PlayServicesState,
  Device,
  InitialSnapshot,
  SessionInfo,
  SessionLifecycleEvent,
  SessionEventType,
} from './transport/types'
export type { CastError, CastErrorCode } from './types/CastError'

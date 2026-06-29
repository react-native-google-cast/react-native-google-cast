// Public entry point for react-native-google-cast v5.
// Barrel file: re-exports only (no implementation logic).

import { CastContext } from './api/CastContext'

// `GoogleCast` (default) and `CastContext` are equivalent (v4 parity).
export default CastContext
export { CastContext }
export { DiscoveryManager } from './api/DiscoveryManager'
export { SessionManager } from './api/SessionManager'
export { CastSession } from './api/CastSession'
export { RemoteMediaClient } from './api/RemoteMediaClient'
export { useRemoteMediaClient } from './api/useRemoteMediaClient'
export { useMediaStatus } from './api/useMediaStatus'
export { useStreamPosition } from './api/useStreamPosition'
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

// RemoteMediaClient public types (method signatures, returns, status inspection).
export type { MediaStatus } from './types/MediaStatus'
export type { MediaInfo } from './types/MediaInfo'
export type { MediaLoadRequest } from './types/MediaLoadRequest'
export type { MediaSeekOptions } from './types/MediaSeekOptions'
export type { MediaQueueItem } from './types/MediaQueueItem'
export type { MediaRepeatMode } from './types/MediaRepeatMode'
export type { TextTrackStyle } from './types/TextTrackStyle'
export type { MediaPlayerState } from './types/MediaPlayerState'
export type { MediaPlayerIdleReason } from './types/MediaPlayerIdleReason'

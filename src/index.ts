// Public entry point for react-native-google-cast v5.
// Barrel file: re-exports only (no implementation logic).

import { CastContext } from './api/CastContext'

// `GoogleCast` (default) and `CastContext` are equivalent (v4 parity).
export default CastContext
export { CastContext }
export { DiscoveryManager } from './api/DiscoveryManager'
export { SessionManager } from './api/SessionManager'
export { CastSession } from './api/CastSession'
export { CastChannel } from './api/CastChannel'
export { RemoteMediaClient } from './api/RemoteMediaClient'
export { useRemoteMediaClient } from './api/useRemoteMediaClient'
export { useMediaStatus } from './api/useMediaStatus'
export { useStreamPosition } from './api/useStreamPosition'
export { useCastChannel } from './api/useCastChannel'
export { useChannelStatus } from './api/useChannelStatus'
export { useCastState } from './api/useCastState'
export { useDevices } from './api/useDevices'
export { useCastSession } from './api/useCastSession'
export { useCastDevice } from './api/useCastDevice'
export type { UseCastSessionOptions } from './api/useCastSession'

// Components (CastButton resolves to CastButton.web on web — renders the
// Cast Web Sender's <google-cast-launcher> once the SDK loads).
export { CastButton } from './components/CastButton'
export type { CastButtonProps } from './components/CastButton'
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
export type { ChannelStatus } from './state/channel.slice'

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

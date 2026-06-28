// Barrel for the public Cast type system. These interfaces/unions are the single
// source of truth that drives nitrogen codegen (referenced by the `.nitro.ts` specs)
// and the hand-written per-platform struct↔GCK converters.

export type { ActiveInputState } from './ActiveInputState'
export type { CastError, CastErrorCode } from './CastError'
export type { ApplicationMetadata } from './ApplicationMetadata'
export type { CastState } from './CastState'
export type { Device, DeviceCapability } from './Device'
export type { MediaHlsSegmentFormat } from './MediaHlsSegmentFormat'
export type { MediaHlsVideoSegmentFormat } from './MediaHlsVideoSegmentFormat'
export type { MediaInfo } from './MediaInfo'
export type { MediaLiveSeekableRange } from './MediaLiveSeekableRange'
export type { MediaLoadRequest } from './MediaLoadRequest'
export type { MediaMetadata } from './MediaMetadata'
export type { MediaMetadataType } from './MediaMetadataType'
export type { MediaPlayerIdleReason } from './MediaPlayerIdleReason'
export type { MediaPlayerState } from './MediaPlayerState'
export type { MediaQueueContainerMetadata } from './MediaQueueContainerMetadata'
export type { MediaQueueContainerType } from './MediaQueueContainerType'
export type { MediaQueueData } from './MediaQueueData'
export type { MediaQueueItem } from './MediaQueueItem'
export type { MediaQueueType } from './MediaQueueType'
export type { MediaRepeatMode } from './MediaRepeatMode'
export type { MediaSeekOptions, MediaSeekResumeState } from './MediaSeekOptions'
export type { MediaStatus } from './MediaStatus'
export type { MediaStreamType } from './MediaStreamType'
export type {
  MediaTrack,
  MediaTrackSubtype,
  MediaTrackType,
} from './MediaTrack'
export type { PlayServicesState } from './PlayServicesState'
export type { StandbyState } from './StandbyState'
export type {
  TextTrackEdgeType,
  TextTrackFontGenericFamily,
  TextTrackFontStyle,
  TextTrackStyle,
  TextTrackWindowType,
} from './TextTrackStyle'
export type { VideoHdrType, VideoInfo } from './VideoInfo'
export type { WebImage } from './WebImage'

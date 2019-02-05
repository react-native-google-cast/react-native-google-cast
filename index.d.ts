import * as React from 'react'
import { ViewStyle } from 'react-native'

export const SESSION_STARTING: string
export const SESSION_STARTED: string
export const SESSION_START_FAILED: string
export const SESSION_SUSPENDED: string
export const SESSION_RESUMING: string
export const SESSION_RESUMED: string
export const SESSION_ENDING: string
export const SESSION_ENDED: string

export const MEDIA_STATUS_UPDATED: string
export const MEDIA_PLAYBACK_STARTED: string
export const MEDIA_PLAYBACK_ENDED: string

export const CHANNEL_CONNECTED: string
export const CHANNEL_DISCONNECTED: string
export const CHANNEL_MESSAGE_RECEIVED: string

export class MediaInfo {}

export class MediaLoadOptions {}

export class MediaQueue {}

export interface MediaStatus {
  idleReason?: 'Cancelled' | 'Error' | 'Finished' | 'Interrupted'
  isMuted: boolean
  mediaInfo: MediaInfo
  playerState: 'Buffering' | 'Idle' | 'Loading' | 'Playing' | 'Paused'
  streamPosition: number
  volume: number
}

export class RemoteMediaClient {
  mediaQueue: MediaQueue
  mediaStatus: MediaStatus
  load(mediaInfo: MediaInfo, options: MediaLoadOptions): Promise<void>
  pause(customData?: Object): Promise<void>
  play(customData?: Object): Promise<void>
  setStreamMuted(muted: boolean, customData?: Object): Promise<void>
}

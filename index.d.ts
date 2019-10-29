declare module 'react-native-google-cast' {
  import * as React from 'react'
  import { EventEmitter, ViewProps } from 'react-native'

  export type CastDevice = {
    id: string
    version: string
    name: string
    model: string
  }

  export type CastState =
    | 'NoDevicesAvailable'
    | 'NotConnected'
    | 'Connecting'
    | 'Connected'

  export type CastOptions = {
    title?: string
    subtitle?: string
    studio?: string
    imageUrl?: string
    posterUrl?: string
    isLive?: boolean
    mediaUrl: string
    contentType?: string
    customData?: any
    streamDuration?: number
    textTrackStyle?: TextTrackStyle
  }

  export type TextTrackStyle = {
    backgroundColor?: string
    edgeColor?: string
    edgeType?: 'depressed' | 'dropShadow' | 'none' | 'outline' | 'raised'
    fontFamily?: string
    fontGenericFamily?:
      | 'casual'
      | 'cursive'
      | 'monoSansSerif'
      | 'monoSerif'
      | 'sansSerif'
      | 'serif'
      | 'smallCaps'
    fontScale?: number
    fontStyle?: 'bold' | 'boldItalic' | 'italic' | 'normal'
    foregroundColor?: string
    windowColor?: string
    windowCornerRadius?: number
    windowType?: 'none' | 'normal' | 'rounded'
  }

  const GoogleCast: {
    getCastDevice(): Promise<CastDevice>
    getCastState(): Promise<CastState>
    castMedia(options: CastOptions): void
    endSession(stopCast?: boolean): Promise<boolean>
    play(): void
    pause(): void
    stop(): void
    seek(playPosition: number): void
    launchExpandedControls(): void
    initChannel(channel: string): Promise<boolean>
    sendMessage(message: string, namespace: string): Promise<boolean>
    showCastPicker(): void
    toggleSubtitles(enabled: boolean, languageCode?: string): Promise<void>
    EventEmitter: EventEmitter
    SESSION_STARTING: string
    SESSION_STARTED: string
    SESSION_START_FAILED: string
    SESSION_SUSPENDED: string
    SESSION_ENDING: string
    SESSION_ENDED: string
    SESSION_RESUMING: string
    SESSION_RESUMED: string
    MEDIA_PROGRESS_UPDATED: string
    MEDIA_STATUS_UPDATED: string
    MEDIA_PLAYBACK_ENDED: string
    MEDIA_PLAYBACK_STARTED: string
    CHANNEL_MESSAGE_RECEIVED: string
  }

  export default GoogleCast

  export class CastButton extends React.Component<ViewProps> {}
}

import type { HybridObject } from 'react-native-nitro-modules'
import type { SessionLifecycleEvent } from '../transport/types'
import type { ActiveInputState } from '../types/ActiveInputState'
import type { ApplicationMetadata } from '../types/ApplicationMetadata'
import type { CastState } from '../types/CastState'
import type { Device } from '../types/Device'
import type { MediaInfo } from '../types/MediaInfo'
import type { MediaLiveSeekableRange } from '../types/MediaLiveSeekableRange'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { MediaMetadata } from '../types/MediaMetadata'
import type { MediaQueueContainerMetadata } from '../types/MediaQueueContainerMetadata'
import type { MediaQueueData } from '../types/MediaQueueData'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaSeekOptions } from '../types/MediaSeekOptions'
import type { MediaStatus } from '../types/MediaStatus'
import type { MediaTrack } from '../types/MediaTrack'
import type { PlayServicesState } from '../types/PlayServicesState'
import type { StandbyState } from '../types/StandbyState'
import type { TextTrackStyle } from '../types/TextTrackStyle'
import type { VideoInfo } from '../types/VideoInfo'
import type { WebImage } from '../types/WebImage'

/**
 * Debug-only HybridObject used to exercise the per-platform struct↔GCK converters.
 *
 * This object is **not** part of the public API and is **not** exported from the package
 * barrel. It serves two internal purposes:
 *
 * 1. **Codegen anchor.** Nitrogen only emits a generated struct when a `.nitro.ts` spec
 *    references it. Referencing every Cast type here drives generation of the full struct
 *    set without pulling the (later-phase) media/session methods onto the production
 *    {@linkcode CastTransport}.
 * 2. **Converter parity seam (T1 / OV2).** Each `roundTrip*` method runs the value through
 *    `struct → GCK → struct` natively, so the shared golden-fixture suite can assert
 *    round-trip identity and cross-platform (iOS == Android) equality on a real device or
 *    simulator without a physical Chromecast.
 * 3. **Native-boundary fake seam (T3).** The `inject*` methods feed a synthetic event
 *    through the *same* stored `initAndSubscribe` callbacks the real GCK listeners
 *    invoke on `CastTransport` (via `CastDebugEventSink`), so tier-1 Maestro E2E can
 *    drive the real Nitro boundary — JS→native struct conversion in, native→JS
 *    callback out — on an emulator/simulator where Cast discovery cannot work.
 *    Active in debug builds only (`#if DEBUG` on iOS; host-app `FLAG_DEBUGGABLE` on
 *    Android); in release builds they resolve `false` and deliver nothing.
 *
 * All `roundTrip*` methods are synchronous pure transforms (no native session, no I/O).
 */
export interface CastDebug
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  roundTripWebImage(value: WebImage): WebImage
  roundTripDevice(value: Device): Device
  roundTripApplicationMetadata(value: ApplicationMetadata): ApplicationMetadata
  roundTripMediaMetadata(value: MediaMetadata): MediaMetadata
  roundTripMediaTrack(value: MediaTrack): MediaTrack
  roundTripTextTrackStyle(value: TextTrackStyle): TextTrackStyle
  roundTripVideoInfo(value: VideoInfo): VideoInfo
  roundTripMediaInfo(value: MediaInfo): MediaInfo
  roundTripMediaLiveSeekableRange(
    value: MediaLiveSeekableRange
  ): MediaLiveSeekableRange
  roundTripMediaQueueItem(value: MediaQueueItem): MediaQueueItem
  roundTripMediaQueueContainerMetadata(
    value: MediaQueueContainerMetadata
  ): MediaQueueContainerMetadata
  roundTripMediaQueueData(value: MediaQueueData): MediaQueueData
  roundTripMediaLoadRequest(value: MediaLoadRequest): MediaLoadRequest
  roundTripMediaSeekOptions(value: MediaSeekOptions): MediaSeekOptions
  roundTripMediaStatus(value: MediaStatus): MediaStatus
  roundTripActiveInputState(value: ActiveInputState): ActiveInputState
  roundTripStandbyState(value: StandbyState): StandbyState
  roundTripPlayServicesState(value: PlayServicesState): PlayServicesState

  // --- Native-boundary fake seam (T3) — debug builds only ---
  //
  // Each resolves `true` when the event was delivered through the live
  // transport's stored callbacks, `false` when the seam is inactive (release
  // build, or `CastTransport.initAndSubscribe` has not run). Delivery happens
  // on the platform main thread, mirroring real GCK event delivery.

  /** Deliver a synthetic cast-state change through the transport's `onState`. */
  injectCastState(castState: CastState): Promise<boolean>
  /** Deliver a synthetic device-list update through the transport's `onDevices`. */
  injectDevices(devices: Device[]): Promise<boolean>
  /** Deliver a synthetic session-lifecycle event through the transport's `onLifecycle`. */
  injectLifecycleEvent(event: SessionLifecycleEvent): Promise<boolean>
  /** Deliver a synthetic media-status push through the transport's `onMediaStatus`. */
  injectMediaStatus(status: MediaStatus): Promise<boolean>
}

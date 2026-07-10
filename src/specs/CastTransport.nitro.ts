import type { HybridObject } from 'react-native-nitro-modules'
import type { CastState } from '../types/CastState'
import type { Device } from '../types/Device'
import type { MediaStatus } from '../types/MediaStatus'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { MediaSeekOptions } from '../types/MediaSeekOptions'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaRepeatMode } from '../types/MediaRepeatMode'
import type { TextTrackStyle } from '../types/TextTrackStyle'
import type { InitialSnapshot, SessionLifecycleEvent } from '../transport/types'

export type { InitialSnapshot, SessionLifecycleEvent }

/**
 * Nitro codegen spec for the singleton native Cast transport.
 *
 * Architecture (see plan: "thin Nitro bridge + fat TypeScript"): this is the
 * only stateful native object. It holds the GCK listener registries and the
 * cached read-state (GCK is main-thread-only, so a sync getter cannot touch it
 * — reads are served from the TS store cache instead). The TS façades + the
 * central session-state machine route every mutation here and re-resolve the
 * current GCK session/client per call, so there is never a stale native handle
 * to crash on after disconnect.
 *
 * This intentionally does **not** `extends CastTransportApi`: nitrogen 0.35's
 * cross-file inherited-member codegen is unverified. It instead mirrors the
 * surface and shares the payload structs (`InitialSnapshot` /
 * `SessionLifecycleEvent`) with `transport/types.ts`, so the API and the
 * codegen spec cannot drift on payloads. The method-surface drift guard lives
 * in `transport/__fakes__/FakeCastTransport.ts`.
 */
export interface CastTransport
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly isAvailable: boolean

  initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus) => void
  ): Promise<InitialSnapshot>

  startSession(deviceId: string): Promise<void>
  endCurrentSession(stopCasting: boolean): Promise<void>

  // CastSession device-level surface (Phase 5) — device volume/mute is the
  // receiver *device* output (GCKCastSession.setDeviceVolume: / Android
  // CastSession.setVolume), NOT the media stream volume (setStreamVolume below).
  // Detail changes stream back via the `deviceStatusChanged` /
  // `standbyStateChanged` / `activeInputStateChanged` lifecycle events.
  setDeviceVolume(volume: number): Promise<void>
  setDeviceMuted(muted: boolean): Promise<void>

  // RemoteMediaClient mutation surface (Phase 4) — mirrors `CastTransportApi`;
  // the drift guard in `__fakes__/FakeCastTransport.ts` fails the build if these
  // diverge from the API. Native impls route to GCKRemoteMediaClient (iOS) /
  // RemoteMediaClient (Android) and push status via `onMediaStatus`.
  loadMedia(request: MediaLoadRequest): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  seek(options: MediaSeekOptions): Promise<void>
  setPlaybackRate(playbackRate: number): Promise<void>
  setActiveTrackIds(trackIds: number[]): Promise<void>
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void>
  setStreamVolume(volume: number): Promise<void>
  setStreamMuted(muted: boolean): Promise<void>
  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode
  ): Promise<void>
  queueInsertItems(items: MediaQueueItem[], beforeItemId: number): Promise<void>
  queueReorderItems(itemIds: number[], beforeItemId: number): Promise<void>
  queueRemoveItems(itemIds: number[]): Promise<void>
  queueNext(): Promise<void>
  queuePrev(): Promise<void>
  queueJumpToItem(itemId: number): Promise<void>
  queueSetRepeatMode(repeatMode: MediaRepeatMode): Promise<void>
  requestMediaStatus(): Promise<void>

  startDiscovery(): void
  stopDiscovery(): void
  setPassiveScan(passive: boolean): void
  readonly isDiscovering: boolean
  readonly isPassiveScan: boolean

  // NOTE: `dispose()` is intentionally NOT declared here. It is inherited from
  // `HybridObject` (nitrogen forbids re-declaring it) and overridden natively to
  // detach the GCK observers; `CastTransportApi.dispose()` maps onto it.
}

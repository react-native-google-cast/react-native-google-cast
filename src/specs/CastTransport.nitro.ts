import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
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
    onMediaStatus: (status: MediaStatus) => void,
    // `channelNamespace` (not `namespace`): nitrogen emits parameter names
    // verbatim into the generated C++, where `namespace` is a reserved keyword.
    onChannelMessage: (channelNamespace: string, message: string) => void,
    onChannelStatus: (
      channelNamespace: string,
      connected: boolean,
      writable: boolean
    ) => void
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

  // Custom channel surface (Phase 5.2) — string-only bridge; mirrors
  // `CastTransportApi` (drift guard in `__fakes__/FakeCastTransport.ts`).
  // Inbound messages/status stream via `onChannelMessage` / `onChannelStatus`.
  addChannel(channelNamespace: string): Promise<void>
  removeChannel(channelNamespace: string): Promise<void>
  sendMessage(channelNamespace: string, message: string): Promise<void>

  // Cast UI surface (Phase 6.1) — imperative one-shots; mirrors
  // `CastTransportApi` (drift guard in `__fakes__/FakeCastTransport.ts`).
  showCastDialog(): Promise<boolean>
  showExpandedControls(): Promise<boolean>
  showIntroductoryOverlay(once: boolean): Promise<boolean>

  // Cast setup / diagnostics UI (Phase 6.2) — mirrors `CastTransportApi`.
  showPlayServicesErrorDialog(errorCode: number): Promise<boolean>

  // RemoteMediaClient mutation surface (Phase 4) — mirrors `CastTransportApi`;
  // the drift guard in `__fakes__/FakeCastTransport.ts` fails the build if these
  // diverge from the API. Native impls route to GCKRemoteMediaClient (iOS) /
  // RemoteMediaClient (Android) and push status via `onMediaStatus`.
  //
  // `customData` (v5-aug.5, v4 parity): threaded on every mutation whose GCK
  // call accepts it on at least one platform (verified against the iOS 4.8.4
  // header + Android 22.0.0 AAR). Android-only slots — GCK iOS has no
  // customData variant — are `queueNext` / `queuePrev` / `queueSetRepeatMode`;
  // iOS silently ignores the param there (v4 documented the same asymmetry).
  // `seek` carries customData inside `MediaSeekOptions`; `setActiveTrackIds`,
  // `setTextTrackStyle` and `requestMediaStatus` take none on either platform.
  loadMedia(request: MediaLoadRequest): Promise<void>
  play(customData?: AnyMap): Promise<void>
  pause(customData?: AnyMap): Promise<void>
  stop(customData?: AnyMap): Promise<void>
  seek(options: MediaSeekOptions): Promise<void>
  setPlaybackRate(playbackRate: number, customData?: AnyMap): Promise<void>
  setActiveTrackIds(trackIds: number[]): Promise<void>
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void>
  setStreamVolume(volume: number, customData?: AnyMap): Promise<void>
  setStreamMuted(muted: boolean, customData?: AnyMap): Promise<void>
  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void>
  queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void>
  queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId: number,
    playPosition?: number,
    customData?: AnyMap
  ): Promise<void>
  queueReorderItems(
    itemIds: number[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void>
  queueRemoveItems(itemIds: number[], customData?: AnyMap): Promise<void>
  queueNext(customData?: AnyMap): Promise<void>
  queuePrev(customData?: AnyMap): Promise<void>
  queueJumpToItem(itemId: number, customData?: AnyMap): Promise<void>
  queueSetRepeatMode(
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void>
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

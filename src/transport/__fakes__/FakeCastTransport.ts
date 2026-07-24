import type { AnyMap } from 'react-native-nitro-modules'
import type { CastTransport } from '../../specs/CastTransport.nitro'
import type {
  CastState,
  CastTransportApi,
  Device,
  InitialSnapshot,
  SessionLifecycleEvent,
} from '../types'
import type { MediaStatus } from '../../types/MediaStatus'
import type { MediaLoadRequest } from '../../types/MediaLoadRequest'
import type { MediaSeekOptions } from '../../types/MediaSeekOptions'
import type { MediaQueueItem } from '../../types/MediaQueueItem'
import type { MediaRepeatMode } from '../../types/MediaRepeatMode'
import type { TextTrackStyle } from '../../types/TextTrackStyle'

export interface FakeCastTransportOptions {
  /** Defaults to `true`. Set `false` to exercise the unavailable path. */
  isAvailable?: boolean
  /** Overrides for the snapshot returned by `initAndSubscribe`. */
  initialSnapshot?: Partial<InitialSnapshot>
}

const DEFAULT_SNAPSHOT: InitialSnapshot = {
  castState: 'noDevicesAvailable',
  playServicesState: 'success',
  devices: [],
}

/**
 * In-memory, scriptable mirror of the **proven** native `CastTransport`
 * contract — the jest + Tier-1 E2E seam. Tests drive it imperatively:
 *
 * ```ts
 * const t = new FakeCastTransport()
 * const store = new CastStore(t)
 * await store.ready
 * t.emitState('connecting')
 * t.emitLifecycle({ type: 'started', session: { sessionId: 's1', device } })
 * ```
 *
 * It mirrors native semantics that the store depends on: `initAndSubscribe`
 * returns the snapshot atomically (callbacks captured first, so a test can emit
 * the instant init resolves); lifecycle events are delivered in the exact order
 * the test emits them; mutations are async and reject whatever the test scripts.
 */
export class FakeCastTransport implements CastTransportApi {
  isAvailable: boolean
  isDiscovering = false
  isPassiveScan = false

  /** Number of times `initAndSubscribe` has been called (must be exactly 1). */
  initCount = 0
  /** Whether `dispose()` has been called. */
  disposed = false
  /** Recorded mutation calls, for assertions. */
  readonly startSessionCalls: string[] = []
  readonly endCurrentSessionCalls: boolean[] = []
  /** Recorded device volume/mute setter calls (Phase 5), in call order. */
  readonly setDeviceVolumeCalls: number[] = []
  readonly setDeviceMutedCalls: boolean[] = []
  /** Recorded custom-channel calls (Phase 5.2), in call order. */
  readonly addChannelCalls: string[] = []
  readonly removeChannelCalls: string[] = []
  readonly sendMessageCalls: Array<{ namespace: string; message: string }> = []
  /** Recorded Cast-UI calls (Phase 6.1). Dialog/expanded are argless → counts. */
  showCastDialogCalls = 0
  showExpandedControlsCalls = 0
  readonly showIntroductoryOverlayCalls: boolean[] = []
  /** Recorded Play-Services-dialog calls (Phase 6.2): the errorCode values. */
  readonly showPlayServicesErrorDialogCalls: number[] = []

  /**
   * Recorded media-mutation calls, keyed by method name, in call order. Each
   * entry is the argument tuple the method was called with. Tests assert
   * routing without caring about the (native-only) GCK side effect.
   */
  readonly mediaCalls: Array<{ method: string; args: readonly unknown[] }> = []

  /**
   * Scriptable mutation behaviour. Override to reject:
   * `t.startSessionBehavior = async () => { throw { code: 'network' } }`.
   */
  startSessionBehavior: (deviceId: string) => Promise<void> = async () => {}
  endCurrentSessionBehavior: (stopCasting: boolean) => Promise<void> =
    async () => {}
  setDeviceVolumeBehavior: (volume: number) => Promise<void> = async () => {}
  setDeviceMutedBehavior: (muted: boolean) => Promise<void> = async () => {}

  /**
   * Scriptable channel behaviour. The default `addChannel` mirrors the native
   * contract — it emits the initial `onChannelStatus` for the namespace
   * *before* resolving (here the Android register-once `{true, true}` shape).
   * Override to script the iOS not-yet-connected case:
   * `t.addChannelBehavior = async (ns) => { t.emitChannelStatus(ns, false, false) }`.
   */
  addChannelBehavior: (namespace: string) => Promise<void> = async (
    namespace
  ) => {
    this.emitChannelStatus(namespace, true, true)
  }
  removeChannelBehavior: (namespace: string) => Promise<void> = async () => {}
  sendMessageBehavior: (namespace: string, message: string) => Promise<void> =
    async () => {}

  /** Scriptable Cast-UI behaviour (default: "shown" → resolve `true`). */
  showCastDialogBehavior: () => Promise<boolean> = async () => true
  showExpandedControlsBehavior: () => Promise<boolean> = async () => true
  showIntroductoryOverlayBehavior: (once: boolean) => Promise<boolean> =
    async () => true
  showPlayServicesErrorDialogBehavior: (errorCode: number) => Promise<boolean> =
    async () => true

  /**
   * Scriptable behaviour for every media mutation, keyed by method name.
   * Defaults to resolve; override to reject a specific call:
   * `t.mediaBehavior.seek = async () => { throw { code: 'noSession' } }`.
   */
  readonly mediaBehavior: Record<string, (...args: never[]) => Promise<void>> =
    {}

  private readonly snapshot: InitialSnapshot
  private onState?: (castState: CastState) => void
  private onDevices?: (devices: Device[]) => void
  private onLifecycle?: (event: SessionLifecycleEvent) => void
  private onMediaStatus?: (status: MediaStatus | undefined) => void
  private onChannelMessage?: (namespace: string, message: string) => void
  private onChannelStatus?: (
    namespace: string,
    connected: boolean,
    writable: boolean
  ) => void

  /**
   * Record a media mutation and run its scripted behaviour (resolve default).
   * Trailing `undefined`s (an omitted optional `customData` / `playPosition`)
   * are trimmed from the recorded tuple, so assertions on calls that omit the
   * optionals stay positional: `{ method: 'play', args: [] }`.
   */
  private media(method: string, ...args: unknown[]): Promise<void> {
    const recorded = [...args]
    while (recorded.length > 0 && recorded[recorded.length - 1] === undefined) {
      recorded.pop()
    }
    this.mediaCalls.push({ method, args: recorded })
    const behavior = this.mediaBehavior[method]
    return behavior
      ? (behavior as (...a: unknown[]) => Promise<void>)(...args)
      : Promise.resolve()
  }

  constructor(options: FakeCastTransportOptions = {}) {
    this.isAvailable = options.isAvailable ?? true
    this.snapshot = { ...DEFAULT_SNAPSHOT, ...options.initialSnapshot }
  }

  async initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus | undefined) => void,
    onChannelMessage: (namespace: string, message: string) => void,
    onChannelStatus: (
      namespace: string,
      connected: boolean,
      writable: boolean
    ) => void
  ): Promise<InitialSnapshot> {
    this.initCount++
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    this.onMediaStatus = onMediaStatus
    this.onChannelMessage = onChannelMessage
    this.onChannelStatus = onChannelStatus
    return this.snapshot
  }

  async startSession(deviceId: string): Promise<void> {
    this.startSessionCalls.push(deviceId)
    return this.startSessionBehavior(deviceId)
  }

  async endCurrentSession(stopCasting: boolean): Promise<void> {
    this.endCurrentSessionCalls.push(stopCasting)
    return this.endCurrentSessionBehavior(stopCasting)
  }

  // --- CastSession device-level surface (Phase 5) ---

  async setDeviceVolume(volume: number): Promise<void> {
    this.setDeviceVolumeCalls.push(volume)
    return this.setDeviceVolumeBehavior(volume)
  }

  async setDeviceMuted(muted: boolean): Promise<void> {
    this.setDeviceMutedCalls.push(muted)
    return this.setDeviceMutedBehavior(muted)
  }

  // --- Custom channel surface (Phase 5.2) ---

  async addChannel(namespace: string): Promise<void> {
    this.addChannelCalls.push(namespace)
    return this.addChannelBehavior(namespace)
  }

  async removeChannel(namespace: string): Promise<void> {
    this.removeChannelCalls.push(namespace)
    return this.removeChannelBehavior(namespace)
  }

  async sendMessage(namespace: string, message: string): Promise<void> {
    this.sendMessageCalls.push({ namespace, message })
    return this.sendMessageBehavior(namespace, message)
  }

  // --- Cast UI surface (Phase 6.1) ---

  async showCastDialog(): Promise<boolean> {
    this.showCastDialogCalls++
    return this.showCastDialogBehavior()
  }

  async showExpandedControls(): Promise<boolean> {
    this.showExpandedControlsCalls++
    return this.showExpandedControlsBehavior()
  }

  async showIntroductoryOverlay(once: boolean): Promise<boolean> {
    this.showIntroductoryOverlayCalls.push(once)
    return this.showIntroductoryOverlayBehavior(once)
  }

  // --- Cast setup / diagnostics UI (Phase 6.2) ---

  async showPlayServicesErrorDialog(errorCode: number): Promise<boolean> {
    this.showPlayServicesErrorDialogCalls.push(errorCode)
    return this.showPlayServicesErrorDialogBehavior(errorCode)
  }

  // --- RemoteMediaClient mutation surface (records + scriptable behaviour) ---

  loadMedia(request: MediaLoadRequest): Promise<void> {
    return this.media('loadMedia', request)
  }
  play(customData?: AnyMap): Promise<void> {
    return this.media('play', customData)
  }
  pause(customData?: AnyMap): Promise<void> {
    return this.media('pause', customData)
  }
  stop(customData?: AnyMap): Promise<void> {
    return this.media('stop', customData)
  }
  seek(options: MediaSeekOptions): Promise<void> {
    return this.media('seek', options)
  }
  setPlaybackRate(playbackRate: number, customData?: AnyMap): Promise<void> {
    return this.media('setPlaybackRate', playbackRate, customData)
  }
  setActiveTrackIds(trackIds: number[]): Promise<void> {
    return this.media('setActiveTrackIds', trackIds)
  }
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void> {
    return this.media('setTextTrackStyle', textTrackStyle)
  }
  setStreamVolume(volume: number, customData?: AnyMap): Promise<void> {
    return this.media('setStreamVolume', volume, customData)
  }
  setStreamMuted(muted: boolean, customData?: AnyMap): Promise<void> {
    return this.media('setStreamMuted', muted, customData)
  }
  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void> {
    return this.media('queueLoad', items, startIndex, repeatMode, customData)
  }
  queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void> {
    return this.media('queueInsertItems', items, beforeItemId, customData)
  }
  queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId: number,
    playPosition?: number,
    customData?: AnyMap
  ): Promise<void> {
    return this.media(
      'queueInsertAndPlayItem',
      item,
      beforeItemId,
      playPosition,
      customData
    )
  }
  queueReorderItems(
    itemIds: number[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void> {
    return this.media('queueReorderItems', itemIds, beforeItemId, customData)
  }
  queueRemoveItems(itemIds: number[], customData?: AnyMap): Promise<void> {
    return this.media('queueRemoveItems', itemIds, customData)
  }
  queueNext(customData?: AnyMap): Promise<void> {
    return this.media('queueNext', customData)
  }
  queuePrev(customData?: AnyMap): Promise<void> {
    return this.media('queuePrev', customData)
  }
  queueJumpToItem(itemId: number, customData?: AnyMap): Promise<void> {
    return this.media('queueJumpToItem', itemId, customData)
  }
  queueSetRepeatMode(
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void> {
    return this.media('queueSetRepeatMode', repeatMode, customData)
  }
  requestMediaStatus(): Promise<void> {
    return this.media('requestMediaStatus')
  }

  startDiscovery(): void {
    this.isDiscovering = true
  }
  stopDiscovery(): void {
    this.isDiscovering = false
  }
  setPassiveScan(passive: boolean): void {
    this.isPassiveScan = passive
  }

  dispose(): void {
    this.disposed = true
    this.onState = undefined
    this.onDevices = undefined
    this.onLifecycle = undefined
    this.onMediaStatus = undefined
    this.onChannelMessage = undefined
    this.onChannelStatus = undefined
  }

  // --- test scripting helpers (not part of CastTransportApi) ---

  /** Emit a cast-state change to the subscribed store. */
  emitState(castState: CastState): void {
    this.onState?.(castState)
  }

  /** Emit a device-list change to the subscribed store. */
  emitDevices(devices: Device[]): void {
    this.onDevices?.(devices)
  }

  /** Emit a session-lifecycle event to the subscribed store. */
  emitLifecycle(event: SessionLifecycleEvent): void {
    this.onLifecycle?.(event)
  }

  /**
   * Emit a media-status update to the subscribed store. `undefined` mirrors the
   * native clear push — a nil/null GCK status while the session stays alive
   * (media unloaded mid-session, v5-82w).
   */
  emitMediaStatus(status: MediaStatus | undefined): void {
    this.onMediaStatus?.(status)
  }

  /** Emit an inbound custom-channel message to the subscribed store. */
  emitChannelMessage(namespace: string, message: string): void {
    this.onChannelMessage?.(namespace, message)
  }

  /** Emit a custom-channel status update to the subscribed store. */
  emitChannelStatus(
    namespace: string,
    connected: boolean,
    writable: boolean
  ): void {
    this.onChannelStatus?.(namespace, connected, writable)
  }
}

// --- drift guard (compile-time; fails `yarn typescript` on divergence) ---
//
// 1. `implements CastTransportApi` above forces the fake to cover the full API.
// 2. This asserts the Nitro `CastTransport` HybridObject is a structural
//    *superset* of `CastTransportApi`, so a method added to the API but not the
//    spec (or with a drifted signature) is a type error. We deliberately do NOT
//    make the spec `extends CastTransportApi` (nitrogen cross-file inherited
//    codegen is unverified) — this assertion is the guard instead.
const _nitroIsSuperset: CastTransportApi = null as unknown as CastTransport
void _nitroIsSuperset

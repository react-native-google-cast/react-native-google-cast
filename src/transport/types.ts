import type { CastState } from '../types/CastState'
import type { PlayServicesState } from '../types/PlayServicesState'
import type { Device } from '../types/Device'
import type { CastError } from '../types/CastError'
import type { MediaStatus } from '../types/MediaStatus'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { MediaSeekOptions } from '../types/MediaSeekOptions'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaRepeatMode } from '../types/MediaRepeatMode'
import type { TextTrackStyle } from '../types/TextTrackStyle'

export type { CastState, PlayServicesState, Device, CastError }

/**
 * Minimal description of a live (or just-ended) Cast session as seen by the
 * transport. The TS {@link CastStore} wraps this in a memoized `CastSession`
 * façade bound to a lifecycle *generation* (see the store) — native never
 * holds a façade handle, so there is no use-after-free on disconnect.
 *
 * Kept deliberately thin for Phase 3: volume / mute / `getClient()` land in
 * Phase 5. This is a Nitro struct (shared with `CastTransport.nitro.ts`), so
 * all fields must be Nitro-marshallable (no `readonly`, no methods).
 */
export interface SessionInfo {
  /** Stable session id from GCK. May be empty during a `starting` transition. */
  sessionId: string
  /** The connected receiver device. */
  device: Device
}

/**
 * Discriminant for {@link SessionLifecycleEvent}. Mirrors the union of
 * `GCKSessionManagerListener` (iOS) and `SessionManagerListener` (Android)
 * callbacks. `resumeFailed` is Android-only but modelled on both for parity.
 */
export type SessionEventType =
  | 'starting'
  | 'started'
  | 'startFailed'
  | 'ending'
  | 'ended'
  | 'resuming'
  | 'resumed'
  | 'resumeFailed'
  | 'suspended'

/**
 * A single ordered session-lifecycle event streamed from native to the store.
 *
 * Modelled as a **flat struct with a `type` discriminant + optional payload**
 * rather than a discriminated union: this is the shape nitrogen can codegen
 * reliably, and the same type backs both {@link CastTransportApi} and the
 * Nitro spec (no API↔codegen drift). The store's session reducer narrows on
 * `type` and reads the field(s) relevant to that transition:
 *
 * | type           | populated fields            |
 * |----------------|-----------------------------|
 * | starting       | deviceId?                   |
 * | started        | session                     |
 * | startFailed    | error                       |
 * | ending         | session                     |
 * | ended          | error? (clean end → absent) |
 * | resuming       | sessionId?                  |
 * | resumed        | session                     |
 * | resumeFailed   | error                       |
 * | suspended      | reason?                     |
 */
export interface SessionLifecycleEvent {
  type: SessionEventType
  /** The live (or ending) session. Present for `started` / `ending` / `resumed`. */
  session?: SessionInfo
  /** Failure detail. Present for `startFailed` / `resumeFailed`; optional on `ended`. */
  error?: CastError
  /** Resuming session id, where the platform reports it (`resuming`). */
  sessionId?: string
  /** Target device id, where the platform reports it (`starting`). */
  deviceId?: string
  /** Platform suspend reason string (`suspended`), for diagnostics. */
  reason?: string
}

/**
 * The atomic initial state returned by {@link CastTransportApi.initAndSubscribe}.
 *
 * Returned in the *same* main-thread turn the observers are attached, so no
 * cast-state / device / lifecycle event can slip between "attach" and "read
 * initial state" (the init race a plain `addListener` cannot close).
 *
 * When the transport is unavailable (`isAvailable === false`) this still
 * carries `playServicesState` — the diagnostic the store must surface — with
 * safe defaults for everything else.
 */
export interface InitialSnapshot {
  castState: CastState
  /** Always populated (the unavailable diagnostic). `success` off-Android. */
  playServicesState: PlayServicesState
  devices: Device[]
  /** A session already live at cold start (already-casting); omitted otherwise. */
  currentSession?: SessionInfo
}

/**
 * Platform-agnostic transport surface — the single source of truth for the
 * native/web/fake implementations. The façades, hooks, and the central
 * {@link CastStore} consume only this interface.
 *
 * - **native:** the Nitro `CastTransport` HybridObject (a structural superset
 *   of this; see the drift guard in `__fakes__/FakeCastTransport.ts`), wrapped
 *   by a thin adapter (`CastTransport.ts`) that translates rejected mutations
 *   into {@link CastError}.
 * - **web:** a Chrome Cast SDK stub (`CastTransport.web.ts`), real impl Phase 8.
 * - **fake:** an in-memory, scriptable mirror of the proven native contract
 *   (`__fakes__/FakeCastTransport.ts`) for jest + Tier-1 E2E.
 *
 * Reads are *not* on this surface — public reads are served synchronously from
 * the store's cache. The transport pushes state via the `initAndSubscribe`
 * callbacks; everything else here is an async mutation or an imperative
 * discovery control.
 */
export interface CastTransportApi {
  /** Whether casting is available on this device/platform (graceful handling). */
  readonly isAvailable: boolean

  /**
   * Attach the native GCK observers and atomically return the initial snapshot.
   * Call exactly once for the transport's lifetime. The three callbacks are
   * persistent: cast-state changes, device-list changes, and the ordered
   * session-lifecycle stream. Resolves after observers are live.
   */
  initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus) => void
  ): Promise<InitialSnapshot>

  /**
   * Start a session with the given device. Re-resolves the current GCK
   * singletons on the main thread per call (never caches a handle). Rejects a
   * {@link CastError} on failure.
   */
  startSession(deviceId: string): Promise<void>

  /**
   * End the current session. `stopCasting` stops receiver playback (vs. just
   * disconnecting the sender). Rejects a {@link CastError} on failure.
   */
  endCurrentSession(stopCasting: boolean): Promise<void>

  // --- RemoteMediaClient mutation surface (Phase 4) ---
  //
  // Every method re-resolves the active session's `GCKRemoteMediaClient` /
  // `RemoteMediaClient` on the main thread per call (never caches a handle), so
  // a call after disconnect rejects a `noSession` {@link CastError} instead of
  // crashing. Each returns when the underlying GCK request *settles* (T6:
  // exactly-once — success resolves, failure/replacement/abort rejects). Status
  // mutations stream back through the `onMediaStatus` callback, never the
  // return value (reads are served from the store cache).

  /** Load (and, per the request, autoplay) media on the active session. */
  loadMedia(request: MediaLoadRequest): Promise<void>
  /** Resume playback of the current item. */
  play(): Promise<void>
  /** Pause playback of the current item. */
  pause(): Promise<void>
  /** Stop playback and unload the current item. */
  stop(): Promise<void>
  /** Seek within the current item (absolute/relative + resume state). */
  seek(options: MediaSeekOptions): Promise<void>
  /** Set the playback rate (1 = normal; GCK clamps the supported range). */
  setPlaybackRate(playbackRate: number): Promise<void>

  /** Set the active media track ids (audio/text); empty array clears them. */
  setActiveTrackIds(trackIds: number[]): Promise<void>
  /** Set the text-track (caption) style. */
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void>

  /** Set the stream volume of the active session (0…1). */
  setStreamVolume(volume: number): Promise<void>
  /** Mute/unmute the active session's stream. */
  setStreamMuted(muted: boolean): Promise<void>

  /** Replace the queue with `items`, starting at `startIndex`, in `repeatMode`. */
  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode
  ): Promise<void>
  /**
   * Insert `items` before `beforeItemId`. A `beforeItemId` that is not a current
   * item id (use `0`, GCK's invalid-item sentinel) appends to the end.
   */
  queueInsertItems(items: MediaQueueItem[], beforeItemId: number): Promise<void>
  /**
   * Move `itemIds` to before `beforeItemId` (same `0` = move-to-end sentinel).
   */
  queueReorderItems(itemIds: number[], beforeItemId: number): Promise<void>
  /** Remove `itemIds` from the queue. */
  queueRemoveItems(itemIds: number[]): Promise<void>
  /** Advance to the next queue item. */
  queueNext(): Promise<void>
  /** Go back to the previous queue item. */
  queuePrev(): Promise<void>
  /** Jump to a specific queue item by id. */
  queueJumpToItem(itemId: number): Promise<void>
  /** Set the queue repeat mode. */
  queueSetRepeatMode(repeatMode: MediaRepeatMode): Promise<void>

  /**
   * Request a fresh media status from the receiver. The result arrives via the
   * `onMediaStatus` callback (this resolves once the *request* settles).
   */
  requestMediaStatus(): Promise<void>

  /** iOS: begin active device discovery. No-op where unsupported. */
  startDiscovery(): void
  /** iOS: end active device discovery. No-op where unsupported. */
  stopDiscovery(): void
  /** iOS: toggle passive (background) scan. No-op where unsupported. */
  setPassiveScan(passive: boolean): void
  /** iOS: whether discovery is currently running (cached read). */
  readonly isDiscovering: boolean
  /** iOS: whether passive scan is enabled (cached read). */
  readonly isPassiveScan: boolean

  /**
   * Detach all native observers and release resources. Used for Fast Refresh /
   * runtime teardown; the long-lived store calls this only on `dispose()`.
   */
  dispose(): void
}

import type { AnyMap } from 'react-native-nitro-modules'
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
import type { ApplicationMetadata } from '../types/ApplicationMetadata'
import type { StandbyState } from '../types/StandbyState'
import type { ActiveInputState } from '../types/ActiveInputState'

export type { CastState, PlayServicesState, Device, CastError }

/**
 * Minimal description of a live (or just-ended) Cast session as seen by the
 * transport. The TS {@link CastStore} wraps this in a memoized `CastSession`
 * façade bound to a lifecycle *generation* (see the store) — native never
 * holds a façade handle, so there is no use-after-free on disconnect.
 *
 * This is a Nitro struct (shared with `CastTransport.nitro.ts`), so all fields
 * must be Nitro-marshallable (no `readonly`, no methods).
 *
 * The device-detail fields (Phase 5) are all **optional**: native populates
 * them (volume/standby/active-input always have a GCK value; metadata/status may
 * genuinely be absent), but the TS store applies defaults, and keeping them
 * optional lets the fake + tests build a `SessionInfo` without every field. The
 * session-detail slice (5.1b) reads these; the façade serves synchronous
 * `getVolume` / `isMuted` / `getApplicationMetadata` / … from that slice.
 */
export interface SessionInfo {
  /** Stable session id from GCK. May be empty during a `starting` transition. */
  sessionId: string
  /** The connected receiver device. */
  device: Device
  /** Metadata of the running receiver app; absent until the app reports it. */
  applicationMetadata?: ApplicationMetadata
  /** Receiver application status text (localized); absent when there is none. */
  applicationStatus?: string
  /**
   * Device output volume in `[0, 1]` — the *receiver device* level, not the
   * media stream (see `setDeviceVolume` vs `setStreamVolume`). Absent only
   * before the first volume report.
   */
  deviceVolume?: number
  /** Whether the device output is muted (device level, not stream). */
  deviceMuted?: boolean
  /** Connected TV/AVR standby state (CEC only; `unknown` off-CEC). */
  standbyState?: StandbyState
  /** Whether the receiver is the active video input (CEC only; `unknown` off-CEC). */
  activeInputState?: ActiveInputState
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
  // Phase 5 — device-detail changes on the *current* live session. Each carries
  // a full fresh `session` (the whole enriched `SessionInfo`, not a delta), so
  // the session-detail slice can replace wholesale, and — because they travel on
  // the same ordered lifecycle stream — a detail change that races a teardown is
  // gated exactly like a media-status push. `standbyStateChanged` /
  // `activeInputStateChanged` map to the two v4 façade change-listeners (routed
  // via the store's typed bus); `deviceStatusChanged` covers volume / mute /
  // application status / metadata (no dedicated v4 listener — slice-only).
  | 'deviceStatusChanged'
  | 'standbyStateChanged'
  | 'activeInputStateChanged'

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
 * | deviceStatusChanged     | session (full fresh detail) |
 * | standbyStateChanged     | session (full fresh detail) |
 * | activeInputStateChanged | session (full fresh detail) |
 */
export interface SessionLifecycleEvent {
  type: SessionEventType
  /**
   * The live (or ending) session. Present for `started` / `ending` / `resumed`,
   * and carries the full fresh device detail on the Phase 5 detail-change events
   * (`deviceStatusChanged` / `standbyStateChanged` / `activeInputStateChanged`).
   */
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
  /**
   * The media status of {@link currentSession}'s RemoteMediaClient at cold
   * start (app relaunch into active playback, or GCK auto-resume completing
   * before JS init). A nil native status is simply omitted here — the seed
   * starts empty either way, so the snapshot never needs an explicit clear
   * (unlike the `onMediaStatus` push path, where `undefined` means "media
   * unloaded"). Only meaningful with `currentSession`.
   */
  mediaStatus?: MediaStatus
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
 * - **web:** the Cast Web Sender SDK transport (`CastTransport.web.ts`),
 *   driving `chrome.cast` + `cast.framework` (see the "Web support" guide for
 *   the platform-gap table).
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
   * Call exactly once for the transport's lifetime. The callbacks are
   * persistent: cast-state changes, device-list changes, the ordered
   * session-lifecycle stream, media-status pushes, and the custom-channel
   * message/status streams. Resolves after observers are live.
   *
   * `onMediaStatus` carries `undefined` when the receiver reports no media
   * (nil/null GCK status) while the session stays alive — media unloaded via
   * `stop()` or the last queue item removed (v5-82w). Session-end teardown is
   * signalled through `onLifecycle`, never through a status push.
   */
  initAndSubscribe(
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

  // --- CastSession device-level surface (Phase 5) ---
  //
  // Device volume / mute is the *receiver device* output level (iOS
  // `GCKCastSession.setDeviceVolume:` / Android `CastSession.setVolume`) — NOT
  // the media stream volume (`setStreamVolume` / `setStreamMuted` on the
  // RemoteMediaClient surface below). Distinct GCK surfaces: do not conflate.
  // Re-resolves the current session per call (never caches a handle); rejects a
  // `noSession` {@link CastError} once disconnected. Reads (current device
  // volume/mute) are served synchronously from the store's session-detail slice
  // — the new value streams back through the `deviceStatusChanged` lifecycle
  // event, never the return value.

  /** Set the device output volume of the active session (0…1). */
  setDeviceVolume(volume: number): Promise<void>
  /** Mute/unmute the active session's device output. */
  setDeviceMuted(muted: boolean): Promise<void>

  // --- Custom channel surface (Phase 5.2) ---
  //
  // v4-parity custom namespaces (`urn:x-cast:…`). String-only bridge: messages
  // cross as plain strings both ways (objects are JSON.stringified in the TS
  // façade; inbound is the raw string GCK produced). Registration is
  // register-once per namespace (duplicate → `alreadyRegistered`; enforced in
  // the TS façade, re-checked natively). Each call re-resolves the current
  // session (Invariant 1); no live session rejects `noSession`. Inbound
  // messages and connection status stream back through the `onChannelMessage`
  // / `onChannelStatus` callbacks — messages are transient (never replayed,
  // never in the snapshot); status is state (the channel slice). The native
  // registry is cleared explicitly on session end/suspend/replace (A1).

  /**
   * Register a custom channel for `namespace` on the active session. Native
   * emits the initial `onChannelStatus` for the namespace *before* this
   * resolves, so an awaiting caller reads a populated status. The initial
   * status carries the real platform value: on iOS `connected` is often still
   * `false` immediately after registration (the virtual connection completes
   * asynchronously and streams an update when it does); Android reports
   * `{connected: true, writable: true}` once and never updates it (its SDK
   * has no per-channel status callbacks — v4 parity).
   */
  addChannel(namespace: string): Promise<void>
  /** Unregister the custom channel for `namespace`. Resolves if not registered. */
  removeChannel(namespace: string): Promise<void>
  /** Send a message on the custom channel for `namespace` (must be registered). */
  sendMessage(namespace: string, message: string): Promise<void>

  // --- Cast UI surface (Phase 6.1) ---
  //
  // Imperative one-shots presenting GCK's own UI. Nothing streams back and no
  // state is cached. The boolean means "the present/launch call was issued";
  // only `showIntroductoryOverlay` verifies actual presentation (E7). The
  // graceful can't-show cases resolve `false` (no Activity, no visible
  // CastButton anchor, overlay already shown once) — genuine native failures
  // reject a typed CastError via the adapter. All UI work on the main thread;
  // CastContext/Activity re-resolved per call (Invariant 1).

  /**
   * Show the Cast dialog: the device chooser, or on Android the in-session
   * controller dialog when a session exists. Unlike v4, no mounted CastButton
   * is required. Resolves `false` when it cannot be presented (Android: no
   * Activity, Cast framework unavailable, or no route selector).
   */
  showCastDialog(): Promise<boolean>
  /**
   * Present the platform's default expanded media controls. Android launches
   * `NitroExpandedControllerActivity` (auto-registered by the library
   * manifest since 6.2; an unresolvable activity — overridden manifest merge
   * or missing Cast framework — rejects `notSupported`, E8 fallback).
   */
  showExpandedControls(): Promise<boolean>
  /**
   * Present the introductory overlay anchored to the currently attached,
   * visible CastButton. Resolves `false` with no anchor or (with `once`) when
   * already shown before. Resolves at presentation on both platforms — GCK's
   * Android dismiss listener is a user-interaction callback, not a lifecycle
   * one, so settling there could strand the promise if the Activity dies
   * while the overlay is up. Android records its once-flag on dismissal; the
   * flag is platform-local (iOS: GCK's flag; Android: SharedPreferences — E2).
   */
  showIntroductoryOverlay(once: boolean): Promise<boolean>

  // --- Cast setup / diagnostics UI (Phase 6.2) ---

  /**
   * Present the Google Play Services error-resolution dialog for `errorCode`
   * (a ConnectionResult value — the façade converts from PlayServicesState).
   * `true` = the dialog was shown (GoogleApiAvailability's own boolean). The
   * graceful can't-show cases resolve `false`: no current Activity, a code
   * needing no dialog (`success`), or a non-Android platform (contract ii /
   * 8A). Genuine native failures reject a typed CastError via the adapter.
   */
  showPlayServicesErrorDialog(errorCode: number): Promise<boolean>

  // --- RemoteMediaClient mutation surface (Phase 4) ---
  //
  // Every method re-resolves the active session's `GCKRemoteMediaClient` /
  // `RemoteMediaClient` on the main thread per call (never caches a handle), so
  // a call after disconnect rejects a `noSession` {@link CastError} instead of
  // crashing. Each returns when the underlying GCK request *settles* (T6:
  // exactly-once — success resolves, failure/replacement/abort rejects). Status
  // mutations stream back through the `onMediaStatus` callback, never the
  // return value (reads are served from the store cache).

  // `customData` (v5-aug.5): optional application-specific payload forwarded
  // with the GCK request wherever GCK accepts one (see the spec's comment for
  // the per-platform matrix). Android-only slots (`queueNext` / `queuePrev` /
  // `queueSetRepeatMode`) silently ignore it on iOS, matching v4.

  /** Load (and, per the request, autoplay) media on the active session. */
  loadMedia(request: MediaLoadRequest): Promise<void>
  /** Resume playback of the current item. */
  play(customData?: AnyMap): Promise<void>
  /** Pause playback of the current item. */
  pause(customData?: AnyMap): Promise<void>
  /** Stop playback and unload the current item. */
  stop(customData?: AnyMap): Promise<void>
  /** Seek within the current item (absolute/relative + resume state). */
  seek(options: MediaSeekOptions): Promise<void>
  /** Set the playback rate (1 = normal; GCK clamps the supported range). */
  setPlaybackRate(playbackRate: number, customData?: AnyMap): Promise<void>

  /** Set the active media track ids (audio/text); empty array clears them. */
  setActiveTrackIds(trackIds: number[]): Promise<void>
  /** Set the text-track (caption) style. */
  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void>

  /** Set the stream volume of the active session (0…1). */
  setStreamVolume(volume: number, customData?: AnyMap): Promise<void>
  /** Mute/unmute the active session's stream. */
  setStreamMuted(muted: boolean, customData?: AnyMap): Promise<void>

  /** Replace the queue with `items`, starting at `startIndex`, in `repeatMode`. */
  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void>
  /**
   * Insert `items` before `beforeItemId`. A `beforeItemId` that is not a current
   * item id (use `0`, GCK's invalid-item sentinel) appends to the end.
   */
  queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void>
  /**
   * Insert `item` before `beforeItemId` (`0` = append) and make it the current
   * item in one atomic GCK request — the receiver assigns the new item's id, so
   * this cannot be composed from `queueInsertItems` + `queueJumpToItem` without
   * a racy status round-trip. `playPosition` (seconds) sets the initial
   * playback position for the item's *first* play; omitted, the item's
   * `startTime` governs.
   */
  queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId: number,
    playPosition?: number,
    customData?: AnyMap
  ): Promise<void>
  /**
   * Move `itemIds` to before `beforeItemId` (same `0` = move-to-end sentinel).
   */
  queueReorderItems(
    itemIds: number[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void>
  /** Remove `itemIds` from the queue. */
  queueRemoveItems(itemIds: number[], customData?: AnyMap): Promise<void>
  /** Advance to the next queue item. (`customData` is Android-only.) */
  queueNext(customData?: AnyMap): Promise<void>
  /** Go back to the previous queue item. (`customData` is Android-only.) */
  queuePrev(customData?: AnyMap): Promise<void>
  /** Jump to a specific queue item by id. */
  queueJumpToItem(itemId: number, customData?: AnyMap): Promise<void>
  /** Set the queue repeat mode. (`customData` is Android-only.) */
  queueSetRepeatMode(
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void>

  /**
   * Request a fresh media status from the receiver. The result arrives via the
   * `onMediaStatus` callback (this resolves once the *request* settles).
   */
  requestMediaStatus(): Promise<void>

  /**
   * iOS: begin active device discovery (needed for custom device pickers —
   * GCK's default gates discovery on the first Cast-button tap; the transport
   * never force-starts it at init, see v5-xr6). No-op where unsupported.
   */
  startDiscovery(): void
  /** iOS: end active device discovery. No-op where unsupported. */
  stopDiscovery(): void
  /** iOS: toggle passive (background) scan. No-op where unsupported. */
  setPassiveScan(passive: boolean): void
  /**
   * iOS: whether discovery is currently running. Cached read: seeded from
   * GCK's `discoveryActive` at init, refreshed by JS start/stopDiscovery
   * read-backs, and flipped `true` on SDK-initiated starts (first Cast-button
   * tap, foreground auto-resume) via GCK's documented discovery-started
   * listener callback. GCK exposes no public stop/suspend signal, so this may
   * briefly read a stale `true` while the app is backgrounded; it re-syncs on
   * foreground.
   */
  readonly isDiscovering: boolean
  /** iOS: whether passive scan is enabled (cached read). */
  readonly isPassiveScan: boolean

  /**
   * Detach all native observers and release resources. Used for Fast Refresh /
   * runtime teardown; the long-lived store calls this only on `dispose()`.
   */
  dispose(): void
}

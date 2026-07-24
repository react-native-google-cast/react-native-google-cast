import type { AnyMap } from 'react-native-nitro-modules'
import type {
  CastError,
  CastState,
  CastTransportApi,
  Device,
  InitialSnapshot,
  SessionLifecycleEvent,
} from './types'
import type { MediaStatus } from '../types/MediaStatus'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { MediaSeekOptions } from '../types/MediaSeekOptions'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaRepeatMode } from '../types/MediaRepeatMode'
import type { TextTrackStyle } from '../types/TextTrackStyle'
import {
  buildCastOptions,
  getCastFramework,
  getChromeCast,
  isSdkPresent,
  onSdkAvailable,
  toCastError,
  webErrorCode,
} from './webSdk'
import type { CastFrameworkNamespace, ChromeCastNamespace } from './webSdk'
import {
  fromMediaLoadRequest,
  fromQueueItem,
  fromQueueLoadRequest,
  fromRepeatMode,
  fromTextTrackStyle,
  toCastState,
  toMediaStatus,
  toSessionInfo,
} from './webConverters'

/**
 * Web transport over the Google Cast **Web Sender SDK** (`chrome.cast` +
 * `cast.framework`), resolved by the bundler on web via the `.web.ts`
 * extension. Implements the same {@link CastTransportApi} contract as the
 * native Nitro transports, feeding the central `CastStore` — same singleton
 * shape, same event ordering, no stateful per-object surfaces.
 *
 * ## SDK loading
 *
 * The page must include Google's sender loader
 * (https://developers.google.com/cast/docs/web_sender/integrate):
 *
 * ```html
 * <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
 * ```
 *
 * `initAndSubscribe` is called once at store construction — usually before
 * the loader has finished. The transport then returns the safe "unavailable"
 * snapshot and finishes activation from the SDK's `__onGCastApiAvailable`
 * handshake, pushing the real cast state through the persistent callbacks
 * (an app-installed handler is chained, not clobbered). If the script is
 * never included, the transport stays gracefully unavailable: reads serve
 * defaults, mutations reject `notSupported`, nothing crashes.
 *
 * ## Platform gaps (web sender vs native GCK) — mapped honestly
 *
 * - **No device list**: the browser owns discovery and the device picker
 *   (`CastContext.requestSession()` opens it). `devices` stays `[]`,
 *   discovery controls are no-ops, and `startSession` opens the browser
 *   picker — its `deviceId` argument cannot be honored.
 * - **No suspend/resume-failed lifecycle**: `cast.framework.SessionState` has
 *   no suspended state, so `suspended` / `resuming` / `resumeFailed` are
 *   never emitted (`SESSION_RESUMED` on page reload maps to `resumed`).
 * - **No playback-rate command**: the web sender exposes no
 *   `setPlaybackRate` request (rate can only be set at load time via
 *   `LoadRequest.playbackRate`) → rejects `notSupported`.
 * - **No atomic insert-and-play**: `QueueInsertItemsRequest` has no
 *   current-item slot → `queueInsertAndPlayItem` rejects `notSupported`.
 * - **No standby state**: not surfaced by the web sender — `standbyState`
 *   is always `unknown`. (`MediaStatus.videoInfo` IS forwarded, from
 *   `Media.videoInfo`.)
 * - **Native-only UI**: `showExpandedControls`, `showIntroductoryOverlay`,
 *   and `showPlayServicesErrorDialog` resolve `false` (graceful can't-show).
 *
 * ## Contracts honored
 *
 * - **InitialSnapshot seeding** (v5-az2): a session live at init (e.g.
 *   `resumeSavedSession` reconnect that completed before JS init) is seeded
 *   through the snapshot with its media status; a later reconnect streams as
 *   a `resumed` lifecycle event followed by a status push.
 * - **`onMediaStatus` null-clear** (v5-82w): when the media session dies
 *   while the cast session lives (media unloaded / stopped), the SDK's
 *   `Media.addUpdateListener` fires with `isAlive === false` and the
 *   transport pushes `undefined`.
 * - **T6-style request ownership**: every session-scoped SDK request is
 *   tracked until it settles exactly once; on session end and on `dispose()`
 *   the transport flushes stragglers with `interrupted`, so a JS promise can
 *   never hang on a dead session. (The web SDK also applies its own
 *   `chrome.cast.media.timeout` defaults on media commands.)
 * - **Invariant 1**: sessions and media sessions are re-resolved from
 *   `CastContext.getInstance()` on every call; the only stored handles are
 *   listener-attachment trackers used for symmetric detach.
 */

const UNAVAILABLE_SNAPSHOT: InitialSnapshot = {
  castState: 'noDevicesAvailable',
  playServicesState: 'success',
  devices: [],
}

const SDK_UNAVAILABLE: CastError = {
  code: 'notSupported',
  message:
    'The Google Cast Web Sender SDK is not available. Include ' +
    '<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script> ' +
    'in your page (see the "Web support" guide).',
}

const NO_SESSION: CastError = {
  code: 'noSession',
  message: 'There is no active Cast session.',
}

const NO_MEDIA_SESSION: CastError = {
  code: 'noSession',
  message: 'The current session has no media session.',
}

/**
 * Dev-build detection for developer warnings: RN(-web) bundlers define
 * `__DEV__`; plain web bundlers define `process.env.NODE_ENV`. Unknown
 * environments stay silent (never warn in production by accident).
 */
function isDevEnvironment(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production'
  }
  return false
}

interface TransportCallbacks {
  onState: (castState: CastState) => void
  onDevices: (devices: Device[]) => void
  onLifecycle: (event: SessionLifecycleEvent) => void
  onMediaStatus: (status: MediaStatus | undefined) => void
  onChannelMessage: (namespace: string, message: string) => void
  onChannelStatus: (
    namespace: string,
    connected: boolean,
    writable: boolean
  ) => void
}

/** A pending request's flush hook (reject-if-not-yet-settled). */
interface PendingEntry {
  flush: (error: CastError) => void
}

class WebCastTransport implements CastTransportApi {
  // Web has no active-discovery controls; the browser owns scanning.
  readonly isDiscovering = false
  readonly isPassiveScan = false

  private callbacks: TransportCallbacks | null = null
  private sdkReady = false
  private disposed = false

  /** The CAF context once activated (re-read for session resolution per call). */
  private context: cast.framework.CastContext | null = null

  // Listener-attachment trackers ONLY (native Invariant 2 twin): they record
  // what attach used so detach targets the exact same instance — they are
  // never used to issue operations.
  private contextListeners: Array<() => void> = []
  private observedSession: cast.framework.CastSession | null = null
  /** Typed removal thunks bound at attach time (symmetric detach). */
  private sessionListeners: Array<() => void> = []
  private observedMedia: chrome.cast.media.Media | null = null
  private mediaListener: ((isAlive: boolean) => void) | null = null

  /** Registered custom channels: namespace → inbound message listener (A1). */
  private readonly channels = new Map<
    string,
    (namespace: string, message: string) => void
  >()

  /** Session-scoped in-flight requests (flushed on session end + dispose). */
  private readonly pendingSession = new Set<PendingEntry>()
  /** Session-independent in-flight requests (flushed on dispose only). */
  private readonly pendingGlobal = new Set<PendingEntry>()

  get isAvailable(): boolean {
    return this.sdkReady
  }

  // --- init / activation ---

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
    this.callbacks = {
      onState,
      onDevices,
      onLifecycle,
      onMediaStatus,
      onChannelMessage,
      onChannelStatus,
    }

    if (isSdkPresent()) {
      // Script loaded before the app bundle — activate synchronously so the
      // snapshot is atomic with observer attachment (no event can slip by).
      return this.activate()
    }

    // SDK not (yet) present: register for the loader's handshake and return
    // the safe snapshot now. On late arrival the persistent callbacks carry
    // the real state — exactly what they exist for.
    onSdkAvailable((available) => {
      if (!available || this.disposed || this.sdkReady || !isSdkPresent()) {
        return
      }
      const snapshot = this.activate()
      this.callbacks?.onState(snapshot.castState)
      if (snapshot.currentSession) {
        // A session that was already reconnected by the time the SDK became
        // available (resumeSavedSession) streams as `resumed` + status push —
        // the store's cold-start path for late establishment.
        this.callbacks?.onLifecycle({
          type: 'resumed',
          session: snapshot.currentSession,
        })
        if (snapshot.mediaStatus) {
          this.callbacks?.onMediaStatus(snapshot.mediaStatus)
        }
      }
    })
    return UNAVAILABLE_SNAPSHOT
  }

  /** Attach CAF observers + build the initial snapshot. SDK must be present. */
  private activate(): InitialSnapshot {
    const framework = getCastFramework()!
    const chromeCast = getChromeCast()!
    const context = framework.CastContext.getInstance()
    // The transport owns setOptions (CAF sends no events until options are
    // set). App-configurable via the `__RNGoogleCastOptions` global.
    context.setOptions(buildCastOptions(chromeCast))
    this.context = context

    const onCastState = (event: cast.framework.CastStateEventData) => {
      this.callbacks?.onState(toCastState(event.castState))
    }
    const onSessionState = (event: cast.framework.SessionStateEventData) => {
      this.handleSessionStateChanged(event)
    }
    context.addEventListener(
      framework.CastContextEventType.CAST_STATE_CHANGED,
      onCastState
    )
    context.addEventListener(
      framework.CastContextEventType.SESSION_STATE_CHANGED,
      onSessionState
    )
    this.contextListeners = [
      () =>
        context.removeEventListener(
          framework.CastContextEventType.CAST_STATE_CHANGED,
          onCastState
        ),
      () =>
        context.removeEventListener(
          framework.CastContextEventType.SESSION_STATE_CHANGED,
          onSessionState
        ),
    ]
    this.sdkReady = true

    const snapshot: InitialSnapshot = {
      castState: toCastState(context.getCastState()),
      playServicesState: 'success',
      devices: [],
    }
    // Cold-start seeding (v5-az2 twin): a session already live at activation
    // goes into the snapshot — with its media status — instead of relying on
    // a lifecycle event that already fired.
    const session = context.getCurrentSession()
    if (session) {
      this.attachSessionObservers(framework, session)
      snapshot.currentSession = toSessionInfo(session)
      const media = session.getMediaSession()
      if (media) {
        this.attachMediaObserver(media)
        snapshot.mediaStatus = toMediaStatus(media)
      }
    }
    return snapshot
  }

  // --- session lifecycle plumbing ---

  private handleSessionStateChanged(
    event: cast.framework.SessionStateEventData
  ): void {
    const framework = getCastFramework()
    if (!framework || !this.callbacks) return
    const { SessionState } = framework
    switch (event.sessionState) {
      case SessionState.SESSION_STARTING: {
        const lifecycle: SessionLifecycleEvent = { type: 'starting' }
        const deviceId = this.safeDeviceId(event.session)
        if (deviceId) lifecycle.deviceId = deviceId
        this.emitLifecycle(lifecycle)
        break
      }
      case SessionState.SESSION_STARTED: {
        this.attachSessionObservers(framework, event.session)
        this.emitLifecycle({
          type: 'started',
          session: toSessionInfo(event.session),
        })
        this.syncMediaSession(event.session)
        break
      }
      case SessionState.SESSION_START_FAILED: {
        this.detachSessionObservers()
        this.emitLifecycle({
          type: 'startFailed',
          error: this.sessionError(event, 'The session failed to start.'),
        })
        break
      }
      case SessionState.SESSION_ENDING: {
        this.emitLifecycle({
          type: 'ending',
          session: toSessionInfo(event.session),
        })
        break
      }
      case SessionState.SESSION_ENDED: {
        // Teardown invariants (native twin): symmetric listener detach,
        // channel registry cleared, session-scoped requests flushed — all
        // BEFORE the `ended` event reaches the store.
        this.detachSessionObservers()
        this.clearChannels(event.session)
        this.flushPending(
          this.pendingSession,
          'The Cast session ended before the request settled.'
        )
        const lifecycle: SessionLifecycleEvent = { type: 'ended' }
        const code = webErrorCode(event.errorCode)
        if (code) {
          lifecycle.error = toCastError(event.errorCode)
        }
        this.emitLifecycle(lifecycle)
        break
      }
      case SessionState.SESSION_RESUMED: {
        this.attachSessionObservers(framework, event.session)
        this.emitLifecycle({
          type: 'resumed',
          session: toSessionInfo(event.session),
        })
        this.syncMediaSession(event.session)
        break
      }
      default:
        // NO_SESSION and anything new: nothing to stream.
        break
    }
  }

  /**
   * Attach the per-session detail + media listeners (replacing any previous
   * attachment — a direct session replacement must not leak the old one's
   * listeners or channels).
   */
  private attachSessionObservers(
    framework: CastFrameworkNamespace,
    session: cast.framework.CastSession
  ): void {
    if (this.observedSession === session) return
    const previous = this.observedSession
    this.detachSessionObservers()
    // A1: a direct session replacement clears the old session's channels too.
    this.clearChannels(previous ?? undefined)

    const detail =
      (type: 'deviceStatusChanged' | 'activeInputStateChanged') => () => {
        // Re-resolve the current session (Invariant 1); a detail event racing
        // a teardown simply drops here — the store gates it anyway.
        const current = this.context?.getCurrentSession()
        if (!current) return
        this.emitLifecycle({ type, session: toSessionInfo(current) })
      }
    const onVolume = detail('deviceStatusChanged')
    const onStatus = detail('deviceStatusChanged')
    const onMetadata = detail('deviceStatusChanged')
    const onActiveInput = detail('activeInputStateChanged')
    const onMediaSession = (event: cast.framework.MediaSessionEventData) => {
      this.attachMediaObserver(event.mediaSession)
      this.callbacks?.onMediaStatus(toMediaStatus(event.mediaSession))
    }

    const { SessionEventType } = framework
    session.addEventListener(SessionEventType.VOLUME_CHANGED, onVolume)
    session.addEventListener(
      SessionEventType.APPLICATION_STATUS_CHANGED,
      onStatus
    )
    session.addEventListener(
      SessionEventType.APPLICATION_METADATA_CHANGED,
      onMetadata
    )
    session.addEventListener(
      SessionEventType.ACTIVE_INPUT_STATE_CHANGED,
      onActiveInput
    )
    session.addEventListener(SessionEventType.MEDIA_SESSION, onMediaSession)

    this.observedSession = session
    this.sessionListeners = [
      () =>
        session.removeEventListener(SessionEventType.VOLUME_CHANGED, onVolume),
      () =>
        session.removeEventListener(
          SessionEventType.APPLICATION_STATUS_CHANGED,
          onStatus
        ),
      () =>
        session.removeEventListener(
          SessionEventType.APPLICATION_METADATA_CHANGED,
          onMetadata
        ),
      () =>
        session.removeEventListener(
          SessionEventType.ACTIVE_INPUT_STATE_CHANGED,
          onActiveInput
        ),
      () =>
        session.removeEventListener(
          SessionEventType.MEDIA_SESSION,
          onMediaSession
        ),
    ]
  }

  /** Detach from the exact session instance attach used (symmetric). */
  private detachSessionObservers(): void {
    for (const remove of this.sessionListeners) remove()
    this.sessionListeners = []
    this.observedSession = null
    this.detachMediaObserver()
  }

  /** Attach the media-status update listener to a (new) media session. */
  private attachMediaObserver(media: chrome.cast.media.Media): void {
    if (this.observedMedia === media) return
    this.detachMediaObserver()
    const listener = (isAlive: boolean) => {
      if (!isAlive) {
        // The media session died. If the cast session lives on (media
        // unloaded / stopped mid-session) this is the null-clear push
        // (v5-82w); after a session teardown the store drops it regardless.
        this.detachMediaObserver()
        if (this.context?.getCurrentSession()) {
          this.callbacks?.onMediaStatus(undefined)
        }
        return
      }
      this.callbacks?.onMediaStatus(toMediaStatus(media))
    }
    media.addUpdateListener(listener)
    this.observedMedia = media
    this.mediaListener = listener
  }

  private detachMediaObserver(): void {
    if (this.observedMedia && this.mediaListener) {
      this.observedMedia.removeUpdateListener(this.mediaListener)
    }
    this.observedMedia = null
    this.mediaListener = null
  }

  /** After (re-)establishment: observe + push the live media status, if any. */
  private syncMediaSession(session: cast.framework.CastSession): void {
    const media = session.getMediaSession()
    if (!media) return
    this.attachMediaObserver(media)
    this.callbacks?.onMediaStatus(toMediaStatus(media))
  }

  private emitLifecycle(event: SessionLifecycleEvent): void {
    this.callbacks?.onLifecycle(event)
  }

  private safeDeviceId(
    session: cast.framework.CastSession | undefined
  ): string | undefined {
    try {
      return session?.getCastDevice()?.label || undefined
    } catch {
      return undefined
    }
  }

  private sessionError(
    event: cast.framework.SessionStateEventData,
    fallback: string
  ): CastError {
    const code = webErrorCode(event.errorCode)
    if (code) return toCastError(event.errorCode)
    return { code: 'failed', message: fallback }
  }

  // --- request tracking (T6 twin) ---

  /**
   * Run an SDK request with exactly-once settlement + flush registration.
   * The first of {success, failure, flush} wins; later callbacks are no-ops.
   */
  private track<T>(
    registry: Set<PendingEntry>,
    run: (resolve: (value: T) => void, reject: (error: unknown) => void) => void
  ): Promise<T> {
    return new Promise<T>((outerResolve, outerReject) => {
      let settled = false
      const entry: PendingEntry = {
        flush: (error) => {
          if (settled) return
          settled = true
          registry.delete(entry)
          outerReject(error)
        },
      }
      const settle = (): boolean => {
        if (settled) return false
        settled = true
        registry.delete(entry)
        return true
      }
      registry.add(entry)
      try {
        run(
          (value) => {
            if (settle()) outerResolve(value)
          },
          (error) => {
            if (settle()) outerReject(toCastError(error))
          }
        )
      } catch (error) {
        if (settle()) outerReject(toCastError(error))
      }
    })
  }

  private flushPending(registry: Set<PendingEntry>, message: string): void {
    const entries = [...registry]
    registry.clear()
    const error: CastError = { code: 'interrupted', message }
    for (const entry of entries) entry.flush(error)
  }

  // --- resolution helpers (Invariant 1: re-resolve per call) ---

  private requireChromeCast(): ChromeCastNamespace {
    const chromeCast = getChromeCast()
    if (!this.sdkReady || !chromeCast) throw SDK_UNAVAILABLE
    return chromeCast
  }

  private requireSession(): cast.framework.CastSession {
    this.requireChromeCast()
    const session = this.context?.getCurrentSession()
    if (!session) throw NO_SESSION
    return session
  }

  private requireMedia(): chrome.cast.media.Media {
    const media = this.requireSession().getMediaSession()
    if (!media) throw NO_MEDIA_SESSION
    return media
  }

  /**
   * Issue a callback-style media command as a tracked session request. The
   * status side effect streams back through `onMediaStatus`, never the
   * return value.
   */
  private mediaRequest(
    run: (
      media: chrome.cast.media.Media,
      chromeCast: ChromeCastNamespace,
      done: () => void,
      fail: (error: chrome.cast.Error) => void
    ) => void
  ): Promise<void> {
    try {
      const chromeCast = this.requireChromeCast()
      const media = this.requireMedia()
      return this.track(this.pendingSession, (resolve, reject) =>
        run(media, chromeCast, () => resolve(), reject)
      )
    } catch (error) {
      return Promise.reject(toCastError(error))
    }
  }

  /**
   * Settle a promise-returning CAF call (`CastSession.loadMedia`,
   * `setVolume`, `sendMessage`, …) as a tracked session request. Those
   * promises resolve with a nullable `chrome.cast.ErrorCode` — a non-null
   * resolution is a failure
   * (https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastSession).
   */
  private sessionRequest(
    run: () => Promise<chrome.cast.ErrorCode | undefined>
  ): Promise<void> {
    try {
      this.requireSession()
      return this.track<void>(this.pendingSession, (resolve, reject) => {
        run().then((errorCode) => {
          if (errorCode) reject(errorCode)
          else resolve()
        }, reject)
      })
    } catch (error) {
      return Promise.reject(toCastError(error))
    }
  }

  // --- sessions ---

  /**
   * Web: opens the **browser's** Cast picker (`CastContext.requestSession()`)
   * — the web sender cannot target a device, so `deviceId` cannot be honored
   * (the device list is always empty on web, so no web caller can obtain one
   * anyway; a dev-only warning flags the loud degradation). Resolves when
   * the session has started; rejects `cancelled` when the user dismisses
   * the picker.
   */
  startSession(deviceId: string): Promise<void> {
    if (deviceId && isDevEnvironment()) {
      console.warn(
        `startSession: the Cast Web Sender ignores deviceId ("${deviceId}") — ` +
          'the browser owns the device picker. Opening the picker instead.'
      )
    }
    return this.requestSessionTracked()
  }

  private requestSessionTracked(): Promise<void> {
    try {
      this.requireChromeCast()
      const context = this.context
      if (!context) throw SDK_UNAVAILABLE
      return this.track<void>(this.pendingGlobal, (resolve, reject) => {
        context.requestSession().then((errorCode) => {
          if (errorCode) reject(errorCode)
          else resolve()
        }, reject)
      })
    } catch (error) {
      return Promise.reject(toCastError(error))
    }
  }

  async endCurrentSession(stopCasting: boolean): Promise<void> {
    this.requireSession()
    this.context!.endCurrentSession(stopCasting)
  }

  // --- CastSession device-level surface ---

  setDeviceVolume(volume: number): Promise<void> {
    return this.sessionRequest(() =>
      this.context!.getCurrentSession()!.setVolume(volume)
    )
  }

  setDeviceMuted(muted: boolean): Promise<void> {
    return this.sessionRequest(() =>
      this.context!.getCurrentSession()!.setMute(muted)
    )
  }

  // --- custom channels ---

  async addChannel(namespace: string): Promise<void> {
    const session = this.requireSession()
    if (this.channels.has(namespace)) {
      throw {
        code: 'alreadyRegistered',
        message: `A channel for ${namespace} is already registered.`,
      } satisfies CastError
    }
    const listener = (ns: string, message: string) => {
      this.callbacks?.onChannelMessage(ns, message)
    }
    session.addMessageListener(namespace, listener)
    this.channels.set(namespace, listener)
    // Initial status BEFORE resolving (contract): the web sender has no
    // per-channel connection callbacks, so — like Android — it reports
    // `{connected: true, writable: true}` once and never updates it.
    this.callbacks?.onChannelStatus(namespace, true, true)
  }

  async removeChannel(namespace: string): Promise<void> {
    const listener = this.channels.get(namespace)
    if (!listener) return // idempotent — not-registered resolves
    this.channels.delete(namespace)
    // Best-effort: the session may already be gone (the registry is cleared
    // with it); removing from a live one keeps the SDK in sync.
    this.context
      ?.getCurrentSession()
      ?.removeMessageListener(namespace, listener)
  }

  sendMessage(namespace: string, message: string): Promise<void> {
    if (!this.channels.has(namespace)) {
      return Promise.reject({
        code: 'invalidRequest',
        message: `No channel registered for ${namespace} — call addChannel first.`,
      } satisfies CastError)
    }
    return this.sessionRequest(() =>
      this.context!.getCurrentSession()!.sendMessage(namespace, message)
    )
  }

  /** Detach + drop every registered channel (session end/replace/dispose). */
  private clearChannels(session?: cast.framework.CastSession): void {
    if (this.channels.size === 0) return
    for (const [namespace, listener] of this.channels) {
      try {
        session?.removeMessageListener(namespace, listener)
      } catch {
        // the session may already be unusable — the registry drop is what matters
      }
    }
    this.channels.clear()
  }

  // --- Cast UI one-shots ---

  /**
   * Web: presents the browser's Cast picker via
   * `CastContext.requestSession()`. `true` = the picker was presented (user
   * cancel still counts as presented); `false` = it could not be (SDK absent
   * or no receivers available); genuine failures reject a typed CastError.
   */
  async showCastDialog(): Promise<boolean> {
    if (!this.sdkReady || !this.context) return false
    try {
      await this.requestSessionTracked()
      return true
    } catch (error) {
      const code = (error as CastError).code
      if (code === 'cancelled') return true // shown; the user dismissed it
      if (code === 'network') return false // receiver_unavailable — can't show
      throw error
    }
  }

  /** Web: no expanded-controls UI ships with the SDK — resolves `false`. */
  async showExpandedControls(): Promise<boolean> {
    return false
  }

  /** Web: no introductory overlay exists — resolves `false`. */
  async showIntroductoryOverlay(_once: boolean): Promise<boolean> {
    return false
  }

  /** Play Services is Android-only — resolves `false` (contract 8A). */
  async showPlayServicesErrorDialog(_errorCode: number): Promise<boolean> {
    return false
  }

  // --- RemoteMediaClient mutation surface ---

  /**
   * Load a single item or a queue. A `queueData` payload crosses **in full**
   * on `LoadRequest.queueData` (id/name/entity/queueType/repeatMode/
   * containerMetadata/items/startIndex/startTime — see
   * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.QueueData),
   * matching the native converters. The web `LoadRequest` constructor
   * requires a `MediaInfo`, so a queue-only request uses its first item's
   * media as the request's `media` field (queueData governs on the receiver).
   */
  loadMedia(request: MediaLoadRequest): Promise<void> {
    try {
      const chromeCast = this.requireChromeCast()
      const session = this.requireSession()
      const mediaInfo =
        request.mediaInfo ?? request.queueData?.items?.[0]?.mediaInfo
      if (!mediaInfo) {
        throw {
          code: 'invalidParameter',
          message:
            'Either mediaInfo or a queueData with at least one item is required.',
        } satisfies CastError
      }
      const loadRequest = fromMediaLoadRequest(request, mediaInfo, chromeCast)
      return this.track<void>(this.pendingSession, (resolve, reject) => {
        session.loadMedia(loadRequest).then((errorCode) => {
          if (errorCode) reject(errorCode)
          else resolve()
        }, reject)
      })
    } catch (error) {
      return Promise.reject(toCastError(error))
    }
  }

  play(customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.PlayRequest()
      if (customData !== undefined) request.customData = customData
      media.play(request, done, fail)
    })
  }

  pause(customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.PauseRequest()
      if (customData !== undefined) request.customData = customData
      media.pause(request, done, fail)
    })
  }

  stop(customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.StopRequest()
      if (customData !== undefined) request.customData = customData
      media.stop(request, done, fail)
    })
  }

  seek(options: MediaSeekOptions): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.SeekRequest()
      if (options.infinite) {
        // Live edge / end of stream: the live seekable range's end, else the
        // stream duration (native GCK's kGCKInvalidTimeInterval semantics
        // have no web twin — an explicit target is required here).
        const end = media.liveSeekableRange?.end ?? media.media?.duration
        if (typeof end !== 'number') {
          fail({
            code: 'invalid_parameter',
            description:
              'seek({infinite: true}) needs a live seekable range or a known duration.',
          } as chrome.cast.Error)
          return
        }
        request.currentTime = end
      } else if (options.relative) {
        request.currentTime = media.getEstimatedTime() + (options.position ?? 0)
      } else {
        request.currentTime = options.position ?? 0
      }
      if (options.resumeState) {
        request.resumeState = (
          options.resumeState === 'play' ? 'PLAYBACK_START' : 'PLAYBACK_PAUSE'
        ) as chrome.cast.media.ResumeState
      }
      if (options.customData !== undefined) {
        request.customData = options.customData
      }
      media.seek(request, done, fail)
    })
  }

  /**
   * Web: **not supported.** The web sender has no playback-rate command —
   * `chrome.cast.media.Media` exposes no `setPlaybackRate`; the rate can
   * only be set at load time (`LoadRequest.playbackRate`).
   */
  setPlaybackRate(_playbackRate: number, _customData?: AnyMap): Promise<void> {
    return Promise.reject({
      code: 'notSupported',
      message:
        'The Cast Web Sender SDK cannot change the playback rate of loaded ' +
        'media. Set MediaLoadRequest.playbackRate when loading instead.',
    } satisfies CastError)
  }

  setActiveTrackIds(trackIds: number[]): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.EditTracksInfoRequest([...trackIds])
      media.editTracksInfo(request, done, fail)
    })
  }

  setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.EditTracksInfoRequest(
        undefined,
        fromTextTrackStyle(textTrackStyle, chromeCast)
      )
      media.editTracksInfo(request, done, fail)
    })
  }

  setStreamVolume(volume: number, customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.VolumeRequest(
        new chromeCast.Volume(volume)
      )
      if (customData !== undefined) request.customData = customData
      media.setVolume(request, done, fail)
    })
  }

  setStreamMuted(muted: boolean, customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.VolumeRequest(
        new chromeCast.Volume(undefined, muted)
      )
      if (customData !== undefined) request.customData = customData
      media.setVolume(request, done, fail)
    })
  }

  queueLoad(
    items: MediaQueueItem[],
    startIndex: number,
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void> {
    try {
      const chromeCast = this.requireChromeCast()
      const session = this.requireSession()
      const request = fromQueueLoadRequest(
        items,
        startIndex,
        repeatMode,
        customData,
        chromeCast
      )
      return this.track<void>(this.pendingSession, (resolve, reject) =>
        session.getSessionObj().queueLoad(request, () => resolve(), reject)
      )
    } catch (error) {
      return Promise.reject(toCastError(error))
    }
  }

  queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.QueueInsertItemsRequest(
        items.map((item) => fromQueueItem(item, chromeCast))
      )
      // `0` is the shared "no such item → append" sentinel; the web SDK
      // appends when insertBefore is unset.
      if (beforeItemId !== 0) request.insertBefore = beforeItemId
      if (customData !== undefined) request.customData = customData
      media.queueInsertItems(request, done, fail)
    })
  }

  /**
   * Web: **not supported.** `chrome.cast.media.QueueInsertItemsRequest` has
   * no current-item slot, and composing insert + jump would need the racy
   * status round-trip this API exists to avoid.
   */
  queueInsertAndPlayItem(
    _item: MediaQueueItem,
    _beforeItemId: number,
    _playPosition?: number,
    _customData?: AnyMap
  ): Promise<void> {
    return Promise.reject({
      code: 'notSupported',
      message:
        'The Cast Web Sender SDK has no atomic insert-and-play queue request. ' +
        'Use queueInsertItems + queueJumpToItem instead.',
    } satisfies CastError)
  }

  queueReorderItems(
    itemIds: number[],
    beforeItemId: number,
    customData?: AnyMap
  ): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) => {
      const request = new chromeCast.media.QueueReorderItemsRequest([
        ...itemIds,
      ])
      if (beforeItemId !== 0) request.insertBefore = beforeItemId
      if (customData !== undefined) request.customData = customData
      media.queueReorderItems(request, done, fail)
    })
  }

  /**
   * Web caveat: the web sender only exposes single-item removal
   * (`Media.queueRemoveItem`), so multiple ids are removed **sequentially**
   * (not atomically) — a mid-sequence failure rejects with the remaining
   * items still queued.
   */
  queueRemoveItems(itemIds: number[], _customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, _chromeCast, done, fail) => {
      const remaining = [...itemIds]
      const step = (): void => {
        const next = remaining.shift()
        if (next === undefined) {
          done()
          return
        }
        media.queueRemoveItem(next, step, fail)
      }
      step()
    })
  }

  queueNext(_customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, _chromeCast, done, fail) =>
      media.queueNext(done, fail)
    )
  }

  queuePrev(_customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, _chromeCast, done, fail) =>
      media.queuePrev(done, fail)
    )
  }

  queueJumpToItem(itemId: number, _customData?: AnyMap): Promise<void> {
    return this.mediaRequest((media, _chromeCast, done, fail) =>
      media.queueJumpToItem(itemId, done, fail)
    )
  }

  queueSetRepeatMode(
    repeatMode: MediaRepeatMode,
    _customData?: AnyMap
  ): Promise<void> {
    return this.mediaRequest((media, _chromeCast, done, fail) =>
      media.queueSetRepeatMode(fromRepeatMode(repeatMode), done, fail)
    )
  }

  requestMediaStatus(): Promise<void> {
    return this.mediaRequest((media, chromeCast, done, fail) =>
      media.getStatus(new chromeCast.media.GetStatusRequest(), done, fail)
    )
  }

  // --- discovery (browser-owned on web) ---

  startDiscovery(): void {}
  stopDiscovery(): void {}
  setPassiveScan(_passive: boolean): void {}

  // --- teardown ---

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.clearChannels(this.observedSession ?? undefined)
    this.detachSessionObservers()
    for (const remove of this.contextListeners) {
      try {
        remove()
      } catch {
        // teardown is best-effort
      }
    }
    this.contextListeners = []
    this.flushPending(this.pendingSession, 'The Cast transport was disposed.')
    this.flushPending(this.pendingGlobal, 'The Cast transport was disposed.')
    this.callbacks = null
    this.context = null
    this.sdkReady = false
  }
}

/**
 * Test-only factory (the singleton below is the app entry). Exported so jest
 * can build isolated instances against a mocked SDK global.
 * @internal
 */
export function createWebCastTransport(): CastTransportApi {
  return new WebCastTransport()
}

export const castTransport: CastTransportApi = new WebCastTransport()

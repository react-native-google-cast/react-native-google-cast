import type { CastError, CastTransportApi, Device } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import {
  SESSION_SLICE_KEY,
  type SessionDetail,
  type SessionState,
  type StoreSession,
} from '../state/session.slice'
import type { ApplicationMetadata } from '../types/ApplicationMetadata'
import type { StandbyState } from '../types/StandbyState'
import type { ActiveInputState } from '../types/ActiveInputState'
import type { EventSubscription } from './subscribeSelector'
import { RemoteMediaClient } from './RemoteMediaClient'
import {
  CastChannel,
  CAST_NAMESPACE_PREFIX,
  RESERVED_MEDIA_NAMESPACE,
} from './CastChannel'
import { CHANNEL_SLICE_KEY, type ChannelState } from '../state/channel.slice'

/** Fallback detail — unreachable after `assertActive` (a live session is seeded). */
const DEFAULT_DETAIL: SessionDetail = {
  deviceVolume: 0,
  deviceMuted: false,
  standbyState: 'unknown',
  activeInputState: 'unknown',
  applicationMetadata: null,
  applicationStatus: null,
}

/**
 * A handle to a Cast session, created and memoized by {@link SessionManager}.
 *
 * Bound to the lifecycle **generation** at which its session became live. This
 * is what prevents the classic Cast use-after-free crash: a façade retained
 * across a disconnect is *stale*, and {@link assertActive} rejects with
 * `noSession` before any operation crosses the bridge — generation, not the
 * reused/absent `id`, is the identity (Invariant 3).
 *
 * Device detail (volume / mute / standby / active-input / application metadata &
 * status) is served **synchronously** from the store's session slice — v4
 * returned promises for these; v5 reads the pushed state cache. Volume/mute
 * *mutations* (`setVolume` / `setMute`) route to the transport's **device**
 * surface (`setDeviceVolume` / `setDeviceMuted`) — the receiver device level,
 * distinct from the media-stream volume on {@link RemoteMediaClient}.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/CastSession) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_cast_session) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.CastSession)
 *
 * @example
 * ```js
 * import { useCastSession } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castSession = useCastSession()
 *   if (castSession) {
 *     const volume = castSession.getVolume()
 *     castSession.getClient()?.play()
 *   }
 * }
 * ```
 */
export class CastSession {
  /** Unique session id (may be reused across sessions — do not use as identity). */
  readonly id: string

  private readonly store: CastStore
  private readonly transport: CastTransportApi
  private readonly generation: number
  /** Latest device observed for this façade's generation (see {@link device}). */
  private lastKnownDevice: Device

  constructor(
    store: CastStore,
    transport: CastTransportApi,
    session: StoreSession
  ) {
    this.store = store
    this.transport = transport
    this.generation = session.generation
    this.id = session.sessionId
    this.lastKnownDevice = session.device
  }

  /**
   * The connected receiver device. A **live read** from the session slice while
   * this façade is the live generation — the façade is memoized per generation
   * (never recreated mid-session), so a mid-session device update (e.g. a
   * receiver rename arriving via `deviceStatusChanged`) must be read through
   * the store, not from a constructor-time copy. Once stale, keeps returning
   * the last-known device (a snapshot; valid even once stale).
   */
  get device(): Device {
    const current = this.store.getSliceState<SessionState>(
      SESSION_SLICE_KEY
    ).current
    if (current && current.generation === this.generation) {
      this.lastKnownDevice = current.device
    }
    return this.lastKnownDevice
  }

  /** Whether this façade still refers to the current live session. */
  get isActive(): boolean {
    return this.store.getCurrentGeneration() === this.generation
  }

  /**
   * Guard that every bridge-crossing operation must call first. Throws a
   * {@link CastError} `noSession` the instant this façade is stale.
   */
  assertActive(): void {
    if (!this.isActive) {
      const error: CastError = {
        code: 'noSession',
        message: 'This Cast session has ended.',
      }
      throw error
    }
  }

  /** The live device detail (post-`assertActive`, so a session is present). */
  private detail(): SessionDetail {
    this.assertActive()
    return (
      this.store.getSliceState<SessionState>(SESSION_SLICE_KEY).detail ??
      DEFAULT_DETAIL
    )
  }

  // --- device detail (synchronous; served from the session slice cache) ---

  /**
   * The device's volume, in the range `[0, 1]`. (v4 returned a `Promise`.)
   * @throws a {@link CastError} `noSession` if this handle is stale.
   */
  getVolume(): number {
    return this.detail().deviceVolume
  }

  /**
   * Whether the device's audio is muted. (v4 name `isMute`; returned a `Promise`.)
   * @throws a {@link CastError} `noSession` if this handle is stale.
   */
  isMute(): boolean {
    return this.detail().deviceMuted
  }

  /**
   * The metadata for the currently running receiver application, or `null` if
   * unavailable. (v4 returned a `Promise`.)
   */
  getApplicationMetadata(): ApplicationMetadata | null {
    return this.detail().applicationMetadata
  }

  /**
   * The current receiver application status text, or `null`. Localized to the
   * Cast device's locale. (v4 returned a `Promise`.)
   */
  getApplicationStatus(): string | null {
    return this.detail().applicationStatus
  }

  /**
   * Whether the receiver's connected TV/AVR is in "standby" (CEC only).
   * (v4 returned a `Promise`.)
   */
  getStandbyState(): StandbyState {
    return this.detail().standbyState
  }

  /**
   * Whether the receiver is currently the active video input (CEC only).
   * (v4 returned a `Promise`.)
   */
  getActiveInputState(): ActiveInputState {
    return this.detail().activeInputState
  }

  // --- mutations (async; route to the transport's device surface) ---

  /**
   * Set the device's volume. Values outside `[0, 1]` are clipped by GCK. Routes
   * to the **device** volume (`setDeviceVolume`), not the media stream.
   */
  async setVolume(volume: number): Promise<void> {
    this.assertActive()
    return this.transport.setDeviceVolume(volume)
  }

  /**
   * Mute or unmute the device's audio. Routes to the **device** mute
   * (`setDeviceMuted`), not the media stream.
   */
  async setMute(muted: boolean): Promise<void> {
    this.assertActive()
    return this.transport.setDeviceMuted(muted)
  }

  // --- media client ---

  /**
   * The {@link RemoteMediaClient} controlling media on this session, or `null`
   * if there is none. Memoized per generation (same ref as
   * {@link useRemoteMediaClient} hands back).
   */
  getClient(): RemoteMediaClient | null {
    this.assertActive()
    return RemoteMediaClient.current(this.store, this.transport)
  }

  // --- custom channels (Phase 5.2) ---

  /**
   * Add a custom channel for `namespace` to this session and return its
   * {@link CastChannel}. The namespace must start with `urn:x-cast:` and is
   * register-once: adding a namespace that is already registered rejects
   * `alreadyRegistered` — remove the existing channel first (or lift the
   * channel to a common parent; see the guide).
   *
   * Resolves once native has registered the channel and reported its initial
   * status, so `channel.connected` is populated — but not necessarily `true`:
   * on iOS the connection completes asynchronously, and a receiver with no
   * listener for the namespace never connects (a `console.warn` flags this,
   * as in v4).
   *
   * @param namespace custom channel identifier starting with `urn:x-cast:`.
   * @param onMessage optional message listener (equivalent to `channel.onMessage`).
   */
  async addChannel(
    namespace: string,
    onMessage?: (message: string) => void
  ): Promise<CastChannel> {
    this.assertActive()
    if (!namespace.startsWith(CAST_NAMESPACE_PREFIX)) {
      const error: CastError = {
        code: 'invalidParameter',
        message: `Custom channel namespaces must start with "${CAST_NAMESPACE_PREFIX}" (got "${namespace}").`,
      }
      throw error
    }
    if (namespace === RESERVED_MEDIA_NAMESPACE) {
      const error: CastError = {
        code: 'invalidParameter',
        message: `The namespace "${RESERVED_MEDIA_NAMESPACE}" is reserved. Please use a different name.`,
      }
      throw error
    }
    const registered =
      this.store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
        namespace
      ]
    if (registered) {
      const error: CastError = {
        code: 'alreadyRegistered',
        message: `A channel for "${namespace}" is already registered (channels are register-once per namespace). Remove the existing channel first.`,
      }
      throw error
    }

    await this.transport.addChannel(namespace)

    if (!this.isActive) {
      // The session was replaced while the native registration was in flight.
      // Native re-resolves the current session per call (Invariant 1), so the
      // channel got registered on the NEW session — while the façade we'd
      // return is bound to this stale generation and could never remove it
      // (`remove()` rejects `noSession`), poisoning the namespace for the
      // whole live session. Undo both sides, then reject.
      this.store.dispatch({ kind: 'channelRemoved', namespace })
      void this.transport.removeChannel(namespace).catch(() => {})
      const error: CastError = {
        code: 'noSession',
        message: 'This Cast session has ended.',
      }
      throw error
    }

    const channel = new CastChannel(
      this.store,
      this.transport,
      namespace,
      this.generation
    )
    if (onMessage) channel.onMessage(onMessage)
    if (!channel.connected) {
      // v4-parity hint (A2): the most common cause is a receiver that never
      // registered a listener for this namespace.
      console.warn(
        `Channel ${namespace} is not connected. Make sure a session is established and you've set a listener in your custom receiver: https://developers.google.com/cast/docs/web_receiver/core_features#custom_messages`
      )
    }
    return channel
  }

  // --- detail change listeners (via the store's typed bus; never replayed) ---

  /**
   * Listen for changes to the receiver's standby state. The subscription fires
   * only while this handle is live and auto-noops once it is stale, so a façade
   * retained across a disconnect can never leak a later session's events.
   */
  onStandbyStateChanged(
    listener: (state: StandbyState) => void
  ): EventSubscription {
    this.assertActive()
    return {
      remove: this.store.on('standbyStateChanged', (event) => {
        if (this.isActive && event.session) {
          listener(event.session.standbyState ?? 'unknown')
        }
      }),
    }
  }

  /**
   * Listen for changes to the receiver's active-input state. Same liveness
   * scoping as {@link onStandbyStateChanged}.
   */
  onActiveInputStateChanged(
    listener: (state: ActiveInputState) => void
  ): EventSubscription {
    this.assertActive()
    return {
      remove: this.store.on('activeInputStateChanged', (event) => {
        if (this.isActive && event.session) {
          listener(event.session.activeInputState ?? 'unknown')
        }
      }),
    }
  }
}

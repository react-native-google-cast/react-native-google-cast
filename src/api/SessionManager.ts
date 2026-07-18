import type {
  CastError,
  CastTransportApi,
  SessionEventType,
} from '../transport/types'
import type { CastStore } from '../state/CastStore'
import { CastSession } from './CastSession'
import type { EventSubscription } from './subscribeSelector'

/** Handler for a session-lifecycle event. `error` is set for the failure events. */
export type SessionEventHandler = (
  session: CastSession | null,
  error?: CastError
) => void

/**
 * Manages Cast sessions over the central {@link CastStore}.
 *
 * Reads are synchronous; {@link getCurrentCastSession} (v4 name preserved)
 * returns a {@link CastSession} memoized per generation, so the same reference
 * is handed back until the session changes (Invariant 2). Mutations are async
 * and reject a {@link CastError}. The lifecycle events come off the store's
 * event bus and are never replayed.
 */
export class SessionManager {
  private readonly store: CastStore
  private readonly transport: CastTransportApi
  private cached: { generation: number; session: CastSession } | null = null

  constructor(store: CastStore, transport: CastTransportApi) {
    this.store = store
    this.transport = transport
    // Keep the memoized façade's device snapshot fresh at the moment the
    // session slice swaps it (see CastSession.refreshDeviceFromStore) — a
    // read-time-only refresh would miss a device update that nothing read
    // before the session suspended, regressing the retained façade to its
    // constructor-time device. Held for the manager's lifetime (one per
    // CastContext); a no-op unless a façade is cached and still live.
    this.store.subscribe(() => {
      this.cached?.session.refreshDeviceFromStore()
    })
  }

  /** The current Cast session, or `null`. Synchronous (v4: returned a Promise). */
  getCurrentCastSession(): CastSession | null {
    const current = this.store.getSnapshot().currentSession
    if (!current) {
      this.cached = null
      return null
    }
    if (this.cached && this.cached.generation === current.generation) {
      return this.cached.session
    }
    const session = new CastSession(this.store, this.transport, current)
    this.cached = { generation: current.generation, session }
    return session
  }

  /** Start a session with a device (from {@link DiscoveryManager.getDevices}). */
  startSession(deviceId: string): Promise<void> {
    return this.transport.startSession(deviceId)
  }

  /**
   * End the current session. Disconnects the sender; the receiver keeps playing
   * unless `stopCasting` is `true`.
   */
  endCurrentSession(stopCasting = false): Promise<void> {
    return this.transport.endCurrentSession(stopCasting)
  }

  /** Called when a session is about to be started. */
  onSessionStarting(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('starting', handler)
  }
  /** Called when a session has been successfully started. */
  onSessionStarted(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('started', handler)
  }
  /** Called when a session has failed to start. */
  onSessionStartFailed(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('startFailed', handler)
  }
  /** Called when a session is about to be ended. */
  onSessionEnding(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('ending', handler)
  }
  /** Called when a session has ended, by request or due to an error. */
  onSessionEnded(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('ended', handler)
  }
  /** Called when a session is being resumed. */
  onSessionResuming(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('resuming', handler)
  }
  /** Called when a session has been resumed. */
  onSessionResumed(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('resumed', handler)
  }
  /** (Android) Called when a suspended session failed to resume. */
  onSessionResumeFailed(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('resumeFailed', handler)
  }
  /** Called when a session has been suspended (e.g. app backgrounded). */
  onSessionSuspended(handler: SessionEventHandler): EventSubscription {
    return this.subscribe('suspended', handler)
  }

  private subscribe(
    type: SessionEventType,
    handler: SessionEventHandler
  ): EventSubscription {
    // The store fires the bus AFTER applying the event, so `getCurrentCastSession`
    // reflects the post-event state (the new session for `started`, `null` once
    // `ended`).
    const off = this.store.on(type, (event) =>
      handler(this.getCurrentCastSession(), event.error)
    )
    return { remove: off }
  }
}

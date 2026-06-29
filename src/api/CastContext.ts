import type { CastState, PlayServicesState } from '../transport/types'
import { castStore, castTransport } from '../state/castStore.singleton'
import { DiscoveryManager } from './DiscoveryManager'
import { SessionManager } from './SessionManager'
import { subscribeSelector } from './subscribeSelector'
import type { EventSubscription } from './subscribeSelector'

/**
 * Root of the Cast SDK — global state and the manager façades. Default export
 * of the library (`GoogleCast` and `CastContext` are equivalent).
 *
 * Read getters are **synchronous** in v5 (they were Promises in v4); they read
 * the central {@link CastStore} cache. The `show*` dialog / expanded-controller
 * methods are deferred to Phase 6 (they depend on the CastButton/activity that
 * don't exist yet).
 */
export class CastContext {
  private static readonly discoveryManager = new DiscoveryManager(
    castStore,
    castTransport
  )
  private static readonly sessionManager = new SessionManager(
    castStore,
    castTransport
  )

  /** The current casting state. Synchronous (v4: returned a Promise). */
  static getCastState(): CastState {
    return castStore.getSnapshot().castState
  }

  /**
   * *(Android)* Google Play Services / Cast-framework availability — the
   * diagnostic for why casting may be unavailable. Synchronous (v4: Promise).
   */
  static getPlayServicesState(): PlayServicesState {
    return castStore.getSnapshot().playServicesState
  }

  /** The {@link DiscoveryManager} for device discovery. */
  static getDiscoveryManager(): DiscoveryManager {
    return this.discoveryManager
  }

  /** The {@link SessionManager} for Cast sessions. */
  static getSessionManager(): SessionManager {
    return this.sessionManager
  }

  /** Listen for changes of the cast state. */
  static onCastStateChanged(
    listener: (castState: CastState) => void
  ): EventSubscription {
    return {
      remove: subscribeSelector(castStore, (s) => s.castState, listener),
    }
  }
}

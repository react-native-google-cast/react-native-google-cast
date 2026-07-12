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
 * the central {@link CastStore} cache. The `show*` Cast-UI methods present
 * GCK's own native UI and are async one-shots: they resolve a boolean meaning
 * "the present/launch call was issued" (graceful can't-show cases resolve
 * `false`; genuine native failures reject a typed `CastError`).
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

  // --- Cast UI one-shots (Phase 6.1) ---
  //
  // The boolean means "the present/launch call was issued" — GCK's iOS present
  // APIs are void and Android can't observe the launched activity, so only
  // `showIntroductoryOverlay` verifies actual presentation. Graceful can't-show
  // cases resolve `false`; genuine native failures reject a typed `CastError`.

  /**
   * Show the Cast dialog: the device chooser, or on Android the in-session
   * controller dialog when a session exists. Unlike v4, no mounted
   * {@link CastButton} is required. Resolves `false` when there is no current
   * Activity (Android); on web it always resolves `false`.
   */
  static showCastDialog(): Promise<boolean> {
    return castTransport.showCastDialog()
  }

  /**
   * Present the platform's default expanded media controls. Resolves `true`
   * once the present/launch call was issued (the launched UI is not
   * observable). On Android, `NitroExpandedControllerActivity` must be
   * registered in the app manifest — a missing registration rejects a
   * `CastError` with code `notSupported`.
   */
  static showExpandedControls(): Promise<boolean> {
    return castTransport.showExpandedControls()
  }

  /**
   * Present the introductory overlay anchored to the currently attached,
   * visible {@link CastButton}. Resolves `true` once the overlay was actually
   * presented, and `false` when there is no visible button anchor or (with
   * `once`) when it was already shown before. Android resolves on dismissal;
   * iOS at presentation. The once-flag is platform-local (iOS: GCK's flag;
   * Android: this library's own preference).
   *
   * @param options `once` (default `true`) shows the overlay only once per
   * install; pass `false` to show it again (iOS clears GCK's shown-flag).
   */
  static showIntroductoryOverlay(options?: {
    once?: boolean
  }): Promise<boolean> {
    return castTransport.showIntroductoryOverlay(options?.once ?? true)
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

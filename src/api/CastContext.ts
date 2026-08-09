import type { CastState, PlayServicesState } from '../transport/types'
import { castStore, castTransport } from '../state/castStore.singleton'
import { getCastSupported } from './castSupport'
import { DiscoveryManager } from './DiscoveryManager'
import { SessionManager } from './SessionManager'
import { subscribeSelector } from './subscribeSelector'
import type { EventSubscription } from './subscribeSelector'

/**
 * PlayServicesState → ConnectionResult code, for the Play Services error
 * dialog. Pinned to the Android converter's value map (contract ii) — the
 * byte-for-byte twin of `PlayServicesState.toGckConnectionResult`
 * (android/.../converters/PlayServicesState+toGckConnectionResult.kt).
 */
const PLAY_SERVICES_ERROR_CODE: Record<PlayServicesState, number> = {
  success: 0,
  missing: 1,
  updateRequired: 2,
  disabled: 3,
  invalid: 9,
  updating: 18,
}

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
   * Whether casting is possible on this platform **at all**, as opposed to
   * whether a receiver happens to be nearby. See {@link useCastSupported} for
   * the per-platform table and for why this is observable rather than constant
   * (on web it flips from `false` to `true` when the Cast SDK finishes
   * loading — reading it once at startup would be `false` forever).
   *
   * Prefer {@link useCastSupported} in components; this is the imperative
   * escape hatch, and it is only meaningful once the web SDK has settled.
   */
  static isSupported(): boolean {
    return getCastSupported()
  }

  /**
   * *(Android)* Google Play Services / Cast-framework availability — the
   * diagnostic for **why** casting is unavailable, and the input to
   * {@link CastContext.showPlayServicesErrorDialog}. Synchronous (v4: Promise).
   *
   * ⚠️ **Android-only. This is always `'success'` on iOS and web**, including
   * in browsers that cannot cast at all — so `getPlayServicesState() ===
   * 'success'` is *not* a cross-platform "can I cast?" check, and reads as
   * healthy on Safari. Use {@link CastContext.isSupported} /
   * {@link useCastSupported} for that question and keep this for the Android
   * detail behind it.
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
   * {@link CastButton} is required. Resolves `false` when Android cannot
   * present it (no current Activity, Cast framework unavailable, no route
   * selector, or saved FragmentManager state). On web this opens the
   * browser's Cast picker (resolving `false` when the Web Sender SDK is not
   * loaded or no receivers are available).
   */
  static showCastDialog(): Promise<boolean> {
    return castTransport.showCastDialog()
  }

  /**
   * Present the platform's default expanded media controls. Resolves `true`
   * once the present/launch call was issued (the launched UI is not
   * observable). On Android, `NitroExpandedControllerActivity` is registered
   * automatically by the library manifest; a `notSupported` rejection means
   * the manifest merge was overridden (e.g. a stale manual declaration) or
   * Play Services is unavailable — check the merged manifest and
   * {@link CastContext.getPlayServicesState}.
   */
  static showExpandedControls(): Promise<boolean> {
    return castTransport.showExpandedControls()
  }

  /**
   * Present the introductory overlay anchored to the currently attached,
   * visible {@link CastButton}. Resolves `true` once the overlay was actually
   * presented, and `false` when there is no visible button anchor or (with
   * `once`) when it was already shown before. Resolves at presentation on
   * both platforms; Android records its "shown" flag when the user dismisses
   * the overlay. The once-flag is platform-local (iOS: GCK's flag; Android:
   * this library's own preference).
   *
   * @param options `once` (default `true`) shows the overlay only once per
   * install; pass `false` to show it again (iOS clears GCK's shown-flag).
   */
  static showIntroductoryOverlay(options?: {
    once?: boolean
  }): Promise<boolean> {
    return castTransport.showIntroductoryOverlay(options?.once ?? true)
  }

  /**
   * Show a dialog with a localized message about the error state. Upon user
   * confirmation the dialog directs them to the Play Store if Google Play
   * services is out of date or missing, or to system settings if it's
   * disabled on the device.
   *
   * @platform android — resolves `false` on iOS and web (8A).
   * @param playServicesState state returned from
   * {@link CastContext.getPlayServicesState}. If it's `success`, the dialog
   * is not shown and the promise resolves `false`.
   */
  static showPlayServicesErrorDialog(
    playServicesState: PlayServicesState
  ): Promise<boolean> {
    return castTransport.showPlayServicesErrorDialog(
      PLAY_SERVICES_ERROR_CODE[playServicesState]
    )
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

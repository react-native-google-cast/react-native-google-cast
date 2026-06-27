import type { CastState } from '../types/CastState'
import type { ListenerSubscription } from '../specs/CastTransport.nitro'

export type { CastState, ListenerSubscription }

/**
 * Platform-agnostic transport surface used by the façades, hooks, and the
 * central session-state machine. Implemented on native by the Nitro
 * `CastTransport` HybridObject (a superset of this) and on web by a Chrome
 * Cast SDK adapter. This is the seam that makes web/Chrome support possible
 * without a separate package, and the seam the tier-1 E2E fake replaces.
 */
export interface CastTransportApi {
  /** Whether casting is available on this device/platform. */
  readonly isAvailable: boolean

  /** Current cast state. */
  getCastState(): CastState

  /** Subscribe to cast-state changes; call `remove()` to unsubscribe. */
  addCastStateListener(
    listener: (state: CastState) => void
  ): ListenerSubscription
}

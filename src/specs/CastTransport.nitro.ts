import type { HybridObject } from 'react-native-nitro-modules'

// NOTE (v5 scaffold): types are co-located here for the initial codegen spike.
// Phase 2 splits named types into their own files under src/types per the
// api-design / build-nitro-modules conventions.

/** The possible casting states (mirrors v4 `CastState` values). */
export type CastState =
  | 'noDevicesAvailable'
  | 'notConnected'
  | 'connecting'
  | 'connected'

/** Handle returned by `add*Listener`; call `remove()` to unsubscribe. */
export interface ListenerSubscription {
  remove: () => void
}

/**
 * Singleton native transport bound to the *current* Cast session.
 *
 * Architecture: this is the only stateful native object. The TS façades
 * (`CastSession` / `RemoteMediaClient` / `CastChannel`) and the central
 * session-state machine sit on top of it and route every call here, so there
 * is never a stale native object to crash on after disconnect. A web/Chrome
 * implementation of the same conceptual transport lives in a non-Nitro
 * `*.web.ts` file (Nitro is native-only).
 */
export interface CastTransport
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /** Whether casting is available on this device/platform (graceful handling). */
  readonly isAvailable: boolean

  /** Current cast state. */
  getCastState(): CastState

  /** Subscribe to cast-state changes. Persistent callback; `remove()` to stop. */
  addCastStateListener(
    listener: (state: CastState) => void
  ): ListenerSubscription
}

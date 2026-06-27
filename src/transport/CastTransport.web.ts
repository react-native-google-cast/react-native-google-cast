import type { CastState, CastTransportApi, ListenerSubscription } from './types'

/**
 * Web / Chrome Cast transport stub. Resolved by the bundler on web via the
 * `.web.ts` extension (Nitro is native-only, so this file never imports it).
 *
 * The real Chrome Cast SDK (`cast.framework` / Presentation API) implementation
 * lands in Phase 8. Until then this reports unavailable and no-ops so web
 * bundles build and degrade gracefully.
 */
export const castTransport: CastTransportApi = {
  isAvailable: false,

  getCastState(): CastState {
    return 'notConnected'
  },

  addCastStateListener(
    _listener: (state: CastState) => void
  ): ListenerSubscription {
    return { remove: () => {} }
  },
}

import type { CastTransportApi, InitialSnapshot } from './types'

/**
 * Web / Chrome Cast transport stub. Resolved by the bundler on web via the
 * `.web.ts` extension (Nitro is native-only, so this file never imports it).
 *
 * The real Chrome Cast SDK (`cast.framework` / Presentation API) implementation
 * lands in Phase 8. Until then this reports unavailable, seeds safe defaults,
 * no-ops the discovery controls, and rejects mutations with `notSupported` so
 * web bundles build and degrade gracefully.
 */
const UNAVAILABLE_SNAPSHOT: InitialSnapshot = {
  castState: 'notConnected',
  playServicesState: 'success',
  devices: [],
}

export const castTransport: CastTransportApi = {
  isAvailable: false,
  isDiscovering: false,
  isPassiveScan: false,

  initAndSubscribe: async () => UNAVAILABLE_SNAPSHOT,

  startSession: async () => {
    throw {
      code: 'notSupported',
      message: 'Casting is not supported on web yet.',
    }
  },
  endCurrentSession: async () => {
    throw {
      code: 'notSupported',
      message: 'Casting is not supported on web yet.',
    }
  },

  startDiscovery: () => {},
  stopDiscovery: () => {},
  setPassiveScan: () => {},

  dispose: () => {},
}

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

function unsupported(): Promise<never> {
  return Promise.reject({
    code: 'notSupported',
    message: 'Casting is not supported on web yet.',
  })
}

// Cast UI one-shots resolve `false` ("was it shown" — it never is on web)
// rather than rejecting: they are UI affordances, not state mutations.
function neverShown(): Promise<boolean> {
  return Promise.resolve(false)
}

export const castTransport: CastTransportApi = {
  isAvailable: false,
  isDiscovering: false,
  isPassiveScan: false,

  initAndSubscribe: async () => UNAVAILABLE_SNAPSHOT,

  startSession: unsupported,
  endCurrentSession: unsupported,

  setDeviceVolume: unsupported,
  setDeviceMuted: unsupported,

  addChannel: unsupported,
  removeChannel: unsupported,
  sendMessage: unsupported,

  showCastDialog: neverShown,
  showExpandedControls: neverShown,
  showIntroductoryOverlay: neverShown,
  showPlayServicesErrorDialog: neverShown,

  loadMedia: unsupported,
  play: unsupported,
  pause: unsupported,
  stop: unsupported,
  seek: unsupported,
  setPlaybackRate: unsupported,
  setActiveTrackIds: unsupported,
  setTextTrackStyle: unsupported,
  setStreamVolume: unsupported,
  setStreamMuted: unsupported,
  queueLoad: unsupported,
  queueInsertItems: unsupported,
  queueReorderItems: unsupported,
  queueRemoveItems: unsupported,
  queueNext: unsupported,
  queuePrev: unsupported,
  queueJumpToItem: unsupported,
  queueSetRepeatMode: unsupported,
  requestMediaStatus: unsupported,

  startDiscovery: () => {},
  stopDiscovery: () => {},
  setPassiveScan: () => {},

  dispose: () => {},
}

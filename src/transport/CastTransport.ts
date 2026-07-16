import { NitroModules } from 'react-native-nitro-modules'
import type { CastTransport } from '../specs/CastTransport.nitro'
import type { CastTransportApi } from './types'
import { parseCastError } from './nativeErrors'

/**
 * Native (iOS/Android) Cast transport. Resolved by the bundler on native via
 * the `.native`/no-suffix extension (web uses `CastTransport.web.ts`).
 *
 * Thin adapter over the Nitro `CastTransport` HybridObject: it forwards the
 * pushed-state callbacks and discovery controls verbatim and only adds error
 * translation on the async mutations — turning a rejected native call into a
 * typed {@link CastError} via {@link parseCastError}. That keeps the unverified
 * Nitro error-propagation contract (#12) isolated to a single swappable spot.
 */
const hybrid = NitroModules.createHybridObject<CastTransport>('CastTransport')

async function mutate<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op()
  } catch (error) {
    throw parseCastError(error)
  }
}

export const castTransport: CastTransportApi = {
  get isAvailable() {
    return hybrid.isAvailable
  },
  get isDiscovering() {
    return hybrid.isDiscovering
  },
  get isPassiveScan() {
    return hybrid.isPassiveScan
  },

  initAndSubscribe: (
    onState,
    onDevices,
    onLifecycle,
    onMediaStatus,
    onChannelMessage,
    onChannelStatus
  ) =>
    hybrid.initAndSubscribe(
      onState,
      onDevices,
      onLifecycle,
      onMediaStatus,
      onChannelMessage,
      onChannelStatus
    ),

  startSession: (deviceId) => mutate(() => hybrid.startSession(deviceId)),
  endCurrentSession: (stopCasting) =>
    mutate(() => hybrid.endCurrentSession(stopCasting)),

  // CastSession device volume/mute — same error-translation wrapper.
  setDeviceVolume: (volume) => mutate(() => hybrid.setDeviceVolume(volume)),
  setDeviceMuted: (muted) => mutate(() => hybrid.setDeviceMuted(muted)),

  // Custom channels — same error-translation wrapper.
  addChannel: (namespace) => mutate(() => hybrid.addChannel(namespace)),
  removeChannel: (namespace) => mutate(() => hybrid.removeChannel(namespace)),
  sendMessage: (namespace, message) =>
    mutate(() => hybrid.sendMessage(namespace, message)),

  // Cast UI one-shots — same error-translation wrapper.
  showCastDialog: () => mutate(() => hybrid.showCastDialog()),
  showExpandedControls: () => mutate(() => hybrid.showExpandedControls()),
  showIntroductoryOverlay: (once) =>
    mutate(() => hybrid.showIntroductoryOverlay(once)),

  // Play Services diagnostics dialog — same error-translation wrapper.
  showPlayServicesErrorDialog: (errorCode) =>
    mutate(() => hybrid.showPlayServicesErrorDialog(errorCode)),

  // RemoteMediaClient mutations — same error-translation wrapper as sessions.
  loadMedia: (request) => mutate(() => hybrid.loadMedia(request)),
  play: () => mutate(() => hybrid.play()),
  pause: () => mutate(() => hybrid.pause()),
  stop: () => mutate(() => hybrid.stop()),
  seek: (options) => mutate(() => hybrid.seek(options)),
  setPlaybackRate: (rate) => mutate(() => hybrid.setPlaybackRate(rate)),
  setActiveTrackIds: (trackIds) =>
    mutate(() => hybrid.setActiveTrackIds(trackIds)),
  setTextTrackStyle: (style) => mutate(() => hybrid.setTextTrackStyle(style)),
  setStreamVolume: (volume) => mutate(() => hybrid.setStreamVolume(volume)),
  setStreamMuted: (muted) => mutate(() => hybrid.setStreamMuted(muted)),
  queueLoad: (items, startIndex, repeatMode) =>
    mutate(() => hybrid.queueLoad(items, startIndex, repeatMode)),
  queueInsertItems: (items, beforeItemId) =>
    mutate(() => hybrid.queueInsertItems(items, beforeItemId)),
  queueReorderItems: (itemIds, beforeItemId) =>
    mutate(() => hybrid.queueReorderItems(itemIds, beforeItemId)),
  queueRemoveItems: (itemIds) => mutate(() => hybrid.queueRemoveItems(itemIds)),
  queueNext: () => mutate(() => hybrid.queueNext()),
  queuePrev: () => mutate(() => hybrid.queuePrev()),
  queueJumpToItem: (itemId) => mutate(() => hybrid.queueJumpToItem(itemId)),
  queueSetRepeatMode: (repeatMode) =>
    mutate(() => hybrid.queueSetRepeatMode(repeatMode)),
  requestMediaStatus: () => mutate(() => hybrid.requestMediaStatus()),

  startDiscovery: () => hybrid.startDiscovery(),
  stopDiscovery: () => hybrid.stopDiscovery(),
  setPassiveScan: (passive) => hybrid.setPassiveScan(passive),

  dispose: () => hybrid.dispose(),
}

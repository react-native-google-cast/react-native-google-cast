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

async function mutate(op: () => Promise<void>): Promise<void> {
  try {
    await op()
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

  initAndSubscribe: (onState, onDevices, onLifecycle) =>
    hybrid.initAndSubscribe(onState, onDevices, onLifecycle),

  startSession: (deviceId) => mutate(() => hybrid.startSession(deviceId)),
  endCurrentSession: (stopCasting) =>
    mutate(() => hybrid.endCurrentSession(stopCasting)),

  startDiscovery: () => hybrid.startDiscovery(),
  stopDiscovery: () => hybrid.stopDiscovery(),
  setPassiveScan: (passive) => hybrid.setPassiveScan(passive),

  dispose: () => hybrid.dispose(),
}

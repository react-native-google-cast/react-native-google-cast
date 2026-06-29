import type { Device } from '../transport/types'
import type { Slice } from './slice'

export const DISCOVERY_SLICE_KEY = 'discovery'

export interface DiscoveryState {
  readonly devices: readonly Device[]
}

/** Freeze the array so a snapshot consumer can never mutate the store's cache. */
function freezeDevices(devices: Device[]): readonly Device[] {
  return Object.freeze(devices.slice())
}

/** Core slice: the discovered device list. */
export const discoverySlice: Slice<DiscoveryState> = {
  key: DISCOVERY_SLICE_KEY,

  seed: (snapshot) => ({ devices: freezeDevices(snapshot.devices) }),

  reduce: (state, event) => {
    if (event.kind === 'devices') {
      return { devices: freezeDevices(event.devices) }
    }
    return state
  },
}

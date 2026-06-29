import type { CastTransportApi, Device } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import { subscribeSelector } from './subscribeSelector'
import type { EventSubscription } from './subscribeSelector'

/**
 * Manages the device-discovery process over the central {@link CastStore}.
 *
 * The framework auto-starts discovery in the foreground and suspends it in the
 * background. On iOS, `startDiscovery`/`stopDiscovery` let an app reduce network
 * traffic / CPU in screens that don't use Cast. The device list is served
 * synchronously from the store snapshot (a frozen array).
 */
export class DiscoveryManager {
  private readonly store: CastStore
  private readonly transport: CastTransportApi

  constructor(store: CastStore, transport: CastTransportApi) {
    this.store = store
    this.transport = transport
  }

  /** Currently available devices. Synchronous (v4: returned a Promise). */
  getDevices(): readonly Device[] {
    return this.store.getSnapshot().devices
  }

  /** Listen for changes to the list of devices. */
  onDevicesUpdated(
    listener: (devices: readonly Device[]) => void
  ): EventSubscription {
    return {
      remove: subscribeSelector(this.store, (s) => s.devices, listener),
    }
  }

  /** *(iOS only)* Start the device-discovery process. */
  startDiscovery(): void {
    this.transport.startDiscovery()
  }

  /** *(iOS only)* Stop the device-discovery process. */
  stopDiscovery(): void {
    this.transport.stopDiscovery()
  }

  /** *(iOS only)* Set whether to use a less resource-intensive "passive" scan. */
  setPassiveScan(on: boolean): void {
    this.transport.setPassiveScan(on)
  }

  /** *(iOS only)* Whether discovery uses a passive scan. Synchronous (v4: Promise). */
  isPassiveScan(): boolean {
    return this.transport.isPassiveScan
  }

  /** *(iOS only)* Whether discovery is currently running. Synchronous (v4: Promise). */
  isRunning(): boolean {
    return this.transport.isDiscovering
  }
}

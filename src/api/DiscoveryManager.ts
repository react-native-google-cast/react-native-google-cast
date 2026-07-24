import type { CastTransportApi, Device } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import { subscribeSelector } from './subscribeSelector'
import type { EventSubscription } from './subscribeSelector'

/**
 * Manages the device-discovery process over the central {@link CastStore}.
 *
 * Discovery is **user-interaction-gated by Google's design** (battery +
 * iOS 14+ local-network privacy), and this library keeps that contract:
 *
 * - **Android** — discovery is completely managed by the Cast framework: it
 *   runs while a Cast button / Cast dialog is on screen and opportunistically
 *   on app foreground; there is no public API to force it.
 * - **iOS** — with the default `GCKCastOptions`
 *   (`startDiscoveryAfterFirstTapOnCastButton = true`), discovery starts when
 *   the user first taps a `CastButton` (which also triggers the local-network
 *   permission flow); afterwards the framework starts/suspends it with the
 *   app's foreground lifecycle. Until that first tap the device list is empty
 *   and `castState` stays `noDevicesAvailable` — expected, not a bug.
 *
 * If you build a **custom device picker** (no `CastButton` on screen), call
 * {@link startDiscovery} on iOS — Google's documented requirement
 * (https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery);
 * on Android keep a (possibly invisible) `CastButton` mounted.
 *
 * The device list is served synchronously from the store snapshot (a frozen
 * array).
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

  /**
   * *(iOS only)* Start the device-discovery process. Required when you build a
   * custom device picker (no `CastButton` on screen) — with the default
   * `GCKCastOptions` the Cast SDK otherwise waits for the first Cast-button
   * tap before discovering anything. Note: the first start on iOS 14+ triggers
   * the local-network permission prompt. No-op on Android (the framework owns
   * discovery there).
   */
  startDiscovery(): void {
    this.transport.startDiscovery()
  }

  /**
   * *(iOS only)* Stop the device-discovery process — an optimization to reduce
   * network traffic / CPU in screens that don't use Cast.
   */
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

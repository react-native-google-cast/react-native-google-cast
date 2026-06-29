import type { HybridObject } from 'react-native-nitro-modules'
import type { CastState } from '../types/CastState'
import type { Device } from '../types/Device'
import type { InitialSnapshot, SessionLifecycleEvent } from '../transport/types'

export type { InitialSnapshot, SessionLifecycleEvent }

/**
 * Nitro codegen spec for the singleton native Cast transport.
 *
 * Architecture (see plan: "thin Nitro bridge + fat TypeScript"): this is the
 * only stateful native object. It holds the GCK listener registries and the
 * cached read-state (GCK is main-thread-only, so a sync getter cannot touch it
 * — reads are served from the TS store cache instead). The TS façades + the
 * central session-state machine route every mutation here and re-resolve the
 * current GCK session/client per call, so there is never a stale native handle
 * to crash on after disconnect.
 *
 * This intentionally does **not** `extends CastTransportApi`: nitrogen 0.35's
 * cross-file inherited-member codegen is unverified. It instead mirrors the
 * surface and shares the payload structs (`InitialSnapshot` /
 * `SessionLifecycleEvent`) with `transport/types.ts`, so the API and the
 * codegen spec cannot drift on payloads. The method-surface drift guard lives
 * in `transport/__fakes__/FakeCastTransport.ts`.
 */
export interface CastTransport
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  readonly isAvailable: boolean

  initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void
  ): Promise<InitialSnapshot>

  startSession(deviceId: string): Promise<void>
  endCurrentSession(stopCasting: boolean): Promise<void>

  startDiscovery(): void
  stopDiscovery(): void
  setPassiveScan(passive: boolean): void
  readonly isDiscovering: boolean
  readonly isPassiveScan: boolean

  // NOTE: `dispose()` is intentionally NOT declared here. It is inherited from
  // `HybridObject` (nitrogen forbids re-declaring it) and overridden natively to
  // detach the GCK observers; `CastTransportApi.dispose()` maps onto it.
}

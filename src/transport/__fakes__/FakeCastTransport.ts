import type { CastTransport } from '../../specs/CastTransport.nitro'
import type {
  CastState,
  CastTransportApi,
  Device,
  InitialSnapshot,
  SessionLifecycleEvent,
} from '../types'

export interface FakeCastTransportOptions {
  /** Defaults to `true`. Set `false` to exercise the unavailable path. */
  isAvailable?: boolean
  /** Overrides for the snapshot returned by `initAndSubscribe`. */
  initialSnapshot?: Partial<InitialSnapshot>
}

const DEFAULT_SNAPSHOT: InitialSnapshot = {
  castState: 'noDevicesAvailable',
  playServicesState: 'success',
  devices: [],
}

/**
 * In-memory, scriptable mirror of the **proven** native `CastTransport`
 * contract — the jest + Tier-1 E2E seam. Tests drive it imperatively:
 *
 * ```ts
 * const t = new FakeCastTransport()
 * const store = new CastStore(t)
 * await store.ready
 * t.emitState('connecting')
 * t.emitLifecycle({ type: 'started', session: { sessionId: 's1', device } })
 * ```
 *
 * It mirrors native semantics that the store depends on: `initAndSubscribe`
 * returns the snapshot atomically (callbacks captured first, so a test can emit
 * the instant init resolves); lifecycle events are delivered in the exact order
 * the test emits them; mutations are async and reject whatever the test scripts.
 */
export class FakeCastTransport implements CastTransportApi {
  isAvailable: boolean
  isDiscovering = false
  isPassiveScan = false

  /** Number of times `initAndSubscribe` has been called (must be exactly 1). */
  initCount = 0
  /** Whether `dispose()` has been called. */
  disposed = false
  /** Recorded mutation calls, for assertions. */
  readonly startSessionCalls: string[] = []
  readonly endCurrentSessionCalls: boolean[] = []

  /**
   * Scriptable mutation behaviour. Override to reject:
   * `t.startSessionBehavior = async () => { throw { code: 'network' } }`.
   */
  startSessionBehavior: (deviceId: string) => Promise<void> = async () => {}
  endCurrentSessionBehavior: (stopCasting: boolean) => Promise<void> =
    async () => {}

  private readonly snapshot: InitialSnapshot
  private onState?: (castState: CastState) => void
  private onDevices?: (devices: Device[]) => void
  private onLifecycle?: (event: SessionLifecycleEvent) => void

  constructor(options: FakeCastTransportOptions = {}) {
    this.isAvailable = options.isAvailable ?? true
    this.snapshot = { ...DEFAULT_SNAPSHOT, ...options.initialSnapshot }
  }

  async initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void
  ): Promise<InitialSnapshot> {
    this.initCount++
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    return this.snapshot
  }

  async startSession(deviceId: string): Promise<void> {
    this.startSessionCalls.push(deviceId)
    return this.startSessionBehavior(deviceId)
  }

  async endCurrentSession(stopCasting: boolean): Promise<void> {
    this.endCurrentSessionCalls.push(stopCasting)
    return this.endCurrentSessionBehavior(stopCasting)
  }

  startDiscovery(): void {
    this.isDiscovering = true
  }
  stopDiscovery(): void {
    this.isDiscovering = false
  }
  setPassiveScan(passive: boolean): void {
    this.isPassiveScan = passive
  }

  dispose(): void {
    this.disposed = true
    this.onState = undefined
    this.onDevices = undefined
    this.onLifecycle = undefined
  }

  // --- test scripting helpers (not part of CastTransportApi) ---

  /** Emit a cast-state change to the subscribed store. */
  emitState(castState: CastState): void {
    this.onState?.(castState)
  }

  /** Emit a device-list change to the subscribed store. */
  emitDevices(devices: Device[]): void {
    this.onDevices?.(devices)
  }

  /** Emit a session-lifecycle event to the subscribed store. */
  emitLifecycle(event: SessionLifecycleEvent): void {
    this.onLifecycle?.(event)
  }
}

// --- drift guard (compile-time; fails `yarn typescript` on divergence) ---
//
// 1. `implements CastTransportApi` above forces the fake to cover the full API.
// 2. This asserts the Nitro `CastTransport` HybridObject is a structural
//    *superset* of `CastTransportApi`, so a method added to the API but not the
//    spec (or with a drifted signature) is a type error. We deliberately do NOT
//    make the spec `extends CastTransportApi` (nitrogen cross-file inherited
//    codegen is unverified) — this assertion is the guard instead.
const _nitroIsSuperset: CastTransportApi = null as unknown as CastTransport
void _nitroIsSuperset

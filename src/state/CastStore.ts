import type {
  CastState,
  CastTransportApi,
  Device,
  InitialSnapshot,
  PlayServicesState,
  SessionEventType,
  SessionLifecycleEvent,
} from '../transport/types'
import type { Slice, StoreEvent } from './slice'
import { CONTEXT_SLICE_KEY, ContextState, contextSlice } from './context.slice'
import {
  DISCOVERY_SLICE_KEY,
  DiscoveryState,
  discoverySlice,
} from './discovery.slice'
import {
  SESSION_SLICE_KEY,
  SessionState,
  StoreSession,
  sessionSlice,
} from './session.slice'
import { mediaSlice } from './media.slice'
import { channelSlice } from './channel.slice'
import { KeyedBus } from './keyedBus'

export type { StoreSession }

/**
 * The referentially-stable state snapshot consumed by façades and hooks via
 * `useSyncExternalStore(subscribe, getSnapshot)`. Frozen; `devices` is a frozen
 * array; `currentSession` is a frozen {@link StoreSession} (ref-stable until the
 * session changes — see Invariant 2/3).
 */
export interface CastSnapshot {
  readonly castState: CastState
  readonly playServicesState: PlayServicesState
  readonly devices: readonly Device[]
  readonly currentSession: StoreSession | null
}

export interface CastStoreOptions {
  /** Extra domain slices (media → P4, channels → P5), each in its own file. */
  readonly slices?: ReadonlyArray<Slice<unknown>>
  /** Skip auto-init; the caller drives `initAndSubscribe` timing. Default true. */
  readonly autoInit?: boolean
}

/** Type-erased registered slice — the registry stores states it produced itself. */
interface RegisteredSlice {
  readonly key: string
  seed(snapshot: InitialSnapshot): unknown
  reduce(state: unknown, event: StoreEvent): unknown
}

/** Safe defaults seeded before `initAndSubscribe` resolves (and on init failure). */
const DEFAULT_SNAPSHOT: InitialSnapshot = {
  castState: 'noDevicesAvailable',
  playServicesState: 'success',
  devices: [],
}

/**
 * The central session-state machine — pure TS, the only long-lived native
 * subscriber. It calls `transport.initAndSubscribe` once, seeds every slice
 * from the atomic initial snapshot, then lives off the ordered event stream.
 *
 * - **Reads** are served synchronously from {@link getSnapshot} (a ref-stable,
 *   frozen cache). State replays to late subscribers via `getSnapshot`.
 * - **Lifecycle events** go to a typed event bus ({@link on}) and are NEVER
 *   replayed — a late subscriber sees state, not missed transitions.
 * - **Permanence:** the native subscription is held for the store's lifetime;
 *   ref-counting governs only the React fan-out (`subscribe`). Only
 *   {@link dispose} tears native down (Fast Refresh / runtime teardown).
 *
 * The singleton lives in the façade layer (Phase 3 T5) so this module stays
 * free of the native Nitro import and is trivially testable with a fake.
 */
export class CastStore {
  /** Resolves once `initAndSubscribe` has seeded the store (or failed safe). */
  readonly ready: Promise<void>

  private readonly transport: CastTransportApi
  private readonly slices: RegisteredSlice[] = []
  private readonly states = new Map<string, unknown>()
  private readonly subscribers = new Set<() => void>()
  private readonly lifecycleBus = new KeyedBus<
    SessionEventType,
    SessionLifecycleEvent
  >()
  // P5.2 — inbound custom-channel messages. Deliberately a separate bus and a
  // dedicated path: messages are transient (never replayed, never state), so
  // they must not run the slice dispatch loop or touch the snapshot.
  private readonly channelMessageBus = new KeyedBus<string, string>()

  private snapshot: CastSnapshot
  private initialized = false
  private disposed = false
  private resolveReady!: () => void
  private mediaPushes = 0

  constructor(transport: CastTransportApi, options: CastStoreOptions = {}) {
    this.transport = transport
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve
    })

    // Core slices register exactly the way Phase 5 domain slices will.
    this.push(contextSlice)
    this.push(discoverySlice)
    this.push(sessionSlice)
    this.push(mediaSlice)
    this.push(channelSlice)
    for (const slice of options.slices ?? []) this.push(slice)

    // Seed safe defaults so getSnapshot() works before init resolves.
    this.snapshot = DEFAULT_SNAPSHOT as unknown as CastSnapshot
    this.seedAll(DEFAULT_SNAPSHOT)

    if (options.autoInit === false) {
      this.resolveReady()
    } else {
      void this.init()
    }
  }

  // --- public read surface ---

  getSnapshot = (): CastSnapshot => this.snapshot

  /** Subscribe to state changes (the `useSyncExternalStore` contract). */
  subscribe = (listener: () => void): (() => void) => {
    this.subscribers.add(listener)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  /** Current lifecycle generation (Invariant 3). */
  getCurrentGeneration(): number {
    return (this.states.get(SESSION_SLICE_KEY) as SessionState).generation
  }

  /** Read a registered slice's state by key (for P4/P5 domain façades). */
  getSliceState<TState>(key: string): TState {
    return this.states.get(key) as TState
  }

  /**
   * How many `mediaStatus` pushes native has handed to JS, counted at the
   * boundary — **before** the media slice's `live` gate can drop one.
   *
   * Diagnostic only (read by `src/debug/storeDiagnostics.ts`), and the one
   * number that separates the two halves of a "status went stale" report: a
   * frozen counter means native stopped calling, a climbing counter with a
   * frozen status means the reducer is dropping. Without it both look
   * identical from the app.
   */
  getMediaPushCount(): number {
    return this.mediaPushes
  }

  // --- typed lifecycle event bus (never replayed) ---

  /** Subscribe to a single session-lifecycle event type. */
  on(
    type: SessionEventType,
    handler: (event: SessionLifecycleEvent) => void
  ): () => void {
    if (this.disposed) return () => {}
    return this.lifecycleBus.subscribe(type, handler)
  }

  /**
   * Subscribe to inbound messages for one custom-channel namespace (P5.2).
   * Messages are transient: never replayed to a late subscriber, never in
   * `getSnapshot`. The `CastChannel` façade is the intended consumer.
   */
  onChannelMessage(
    namespace: string,
    handler: (message: string) => void
  ): () => void {
    if (this.disposed) return () => {}
    return this.channelMessageBus.subscribe(namespace, handler)
  }

  // --- mutation entry (P4/P5 feed their native events here too) ---

  /** Apply a store event, updating slices and notifying state subscribers. */
  dispatch(event: StoreEvent): void {
    if (this.disposed) return
    let dirty = false
    for (const slice of this.slices) {
      const prev = this.states.get(slice.key)
      const next = slice.reduce(prev, event)
      if (next !== prev) {
        this.states.set(slice.key, next)
        dirty = true
      }
    }
    if (dirty) {
      this.rebuildSnapshot()
      this.notify()
    }
  }

  /** Detach native observers and release React/bus subscriptions. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    try {
      this.transport.dispose()
    } catch {
      // teardown is best-effort; never throw out of dispose
    }
    this.subscribers.clear()
    this.lifecycleBus.clear()
    this.channelMessageBus.clear()
  }

  /** Register an extra slice. Only valid before init has streamed any events. */
  registerSlice<TState>(slice: Slice<TState>): void {
    if (this.initialized) {
      throw new Error(
        'CastStore.registerSlice must be called before init; pass slices via the constructor.'
      )
    }
    this.push(slice)
    this.states.set(slice.key, slice.seed(DEFAULT_SNAPSHOT))
    this.rebuildSnapshot()
  }

  // --- internals ---

  private push<TState>(slice: Slice<TState>): void {
    this.slices.push(slice as unknown as RegisteredSlice)
  }

  private async init(): Promise<void> {
    try {
      const snapshot = await this.transport.initAndSubscribe(
        (castState) => this.dispatch({ kind: 'state', castState }),
        (devices) => this.dispatch({ kind: 'devices', devices }),
        (event) => this.dispatchLifecycle(event),
        // `undefined` from native (nil/null GCK status: media unloaded while
        // the session stays alive) becomes an explicit `null` clear (v5-82w).
        (status) => {
          this.mediaPushes += 1
          this.dispatch({ kind: 'mediaStatus', status: status ?? null })
        },
        (namespace, message) => this.channelMessageBus.emit(namespace, message),
        (namespace, connected, writable) =>
          this.dispatch({
            kind: 'channelStatus',
            namespace,
            connected,
            writable,
          })
      )
      this.seedAll(snapshot)
    } catch {
      // Never crash on a transport init failure — stay on safe defaults.
    } finally {
      this.initialized = true
      this.resolveReady()
    }
  }

  private dispatchLifecycle(event: SessionLifecycleEvent): void {
    // Update state first, then fire the bus, so a bus handler that reads the
    // store sees consistent state. The bus fires for EVERY lifecycle event
    // (incl. transient starting/resuming/ending that don't change state).
    this.dispatch({ kind: 'lifecycle', event })
    this.emit(event)
  }

  private emit(event: SessionLifecycleEvent): void {
    this.lifecycleBus.emit(event.type, event)
  }

  private seedAll(snapshot: InitialSnapshot): void {
    for (const slice of this.slices) {
      this.states.set(slice.key, slice.seed(snapshot))
    }
    this.rebuildSnapshot()
    this.notify()
  }

  private rebuildSnapshot(): void {
    const context = this.states.get(CONTEXT_SLICE_KEY) as ContextState
    const discovery = this.states.get(DISCOVERY_SLICE_KEY) as DiscoveryState
    const session = this.states.get(SESSION_SLICE_KEY) as SessionState
    this.snapshot = Object.freeze({
      castState: context.castState,
      playServicesState: context.playServicesState,
      devices: discovery.devices,
      currentSession: session.current,
    })
  }

  private notify(): void {
    for (const listener of [...this.subscribers]) listener()
  }
}

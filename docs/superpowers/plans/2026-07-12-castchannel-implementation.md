# CastChannel (Phase 5 Slice 5.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v4-parity custom channels — `CastSession.addChannel` / `CastChannel` / `useCastChannel` with namespace-scoped message routing over a string-only Nitro bridge.

**Architecture:** One new transport surface (`addChannel`/`removeChannel`/`sendMessage` + `onChannelMessage`/`onChannelStatus` push callbacks) lands first as a **barrier** (Task 1), then three lanes fan out: TS (store slice + keyed message bus + façade + hook, Tasks 2–7), iOS (`GCKCastChannel` subclass + registry, Task 8), Android (`Cast.MessageReceivedCallback` + registry, Task 9). The two-flow split is fixed: inbound **messages** ride a namespace-keyed bus (transient, never replayed, not in the snapshot); **connected/writable** is state (`channelStatus` StoreEvent → `channel.slice`).

**Tech Stack:** TypeScript + Nitro Modules (nitrogen codegen), jest + `FakeCastTransport`, Swift/GCK (iOS), Kotlin/play-services-cast-framework (Android).

**Spec:** `docs/superpowers/specs/2026-07-11-castchannel-design.md` (+ eng-review outcomes A1/A2/C1/T1 — folded into every task below).

**Verification commands (used throughout):**

```bash
yarn typescript                      # tsc --noEmit (drift guard)
yarn test                            # jest
npx prettier --check "src/**/*.ts"   # (yarn lint has a pre-existing env failure — use prettier directly)
yarn specs                           # nitrogen codegen (NOT `yarn nitrogen` — the script is `specs`)

# Android compile check (from example/android):
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew :react-native-google-cast:compileDebugKotlin

# iOS compile check (after `pod install` in example/ios when nitrogen output changed):
xcodebuild -project example/ios/Pods/Pods.xcodeproj -target NitroGoogleCast \
  -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

**Parallelization:** Task 1 is the barrier (inline on `v5`, pushed). Tasks 2–7 = lane B (branch `petrbela/p52-ts`), Task 8 = lane C (`petrbela/p52-ios`), Task 9 = lane D (`petrbela/p52-android`) — all three branch from the Task 1 commit and touch disjoint dirs (`src/` vs `ios/` vs `android/`). Task 10 assembles.

---

### Task 0: Fold eng-review outcomes into the design doc + update beads

**Files:**
- Modify: `docs/superpowers/specs/2026-07-11-castchannel-design.md`
- Beads: `v5-8me.6`–`.9` descriptions (bd CLI)

- [ ] **Step 1: Amend the design doc** — add an "Eng-review amendments (2026-07-12)" section at the end, before "Non-goals":

```markdown
## Eng-review amendments (2026-07-12)

Accepted findings from `/plan-eng-review`, folded into the implementation plan
(`docs/superpowers/plans/2026-07-12-castchannel-implementation.md`):

- **A1 — explicit native registry lifecycle.** "Implicitly cleared on teardown"
  is upgraded to explicit: `HybridCastTransport` clears its channel registry on
  session end/suspend/replace and on dispose (mirroring the shipped
  `attachMediaCallback`/`detachMediaCallback` discipline). The app re-adds
  channels on the new session, per the v4 guide.
- **A2 — real initial status + v4 warning.** The initial `onChannelStatus`
  emitted before `addChannel` resolves carries the **real** GCK value — on iOS
  `connected` is often still `false` right after `add(channel:)` (the virtual
  connection completes asynchronously); Android is `{true, true}`. The line
  above stating the façade "sees a populated value" means *populated*, not
  *true*. TS `addChannel` replicates v4's `console.warn` when the channel is
  not connected after resolve (the load-bearing hint for an unwired receiver).
- **C1 — `KeyedBus<K, V>`.** The channel message bus and the existing lifecycle
  bus share identical mechanics; one generic keyed multi-handler bus
  (subscribe→unsubscribe, copy-on-emit) backs both. The lifecycle-bus retrofit
  is behavior-preserving and covered by the existing store tests.
- **T1 — duplicate-namespace rejection.** `addChannel` on an already-registered
  namespace rejects a new typed `CastError` code **`alreadyRegistered`** with a
  remove-first message (v4: register-once). Registration presence is tracked in
  `channel.slice`; a new TS-only `channelRemoved` StoreEvent deletes the entry.
  `CastChannel.remove()` dispatches it **synchronously, before** the bridge
  call, so an immediate re-add (a `useCastChannel` remount) passes the
  register-once check without awaiting the removal — native ordering stays
  safe because the main-thread queue processes the remove before the re-add.
- **2d minor — `sendMessage` awaits its `PendingResult<Status>`** and rejects a
  typed `CastError` on non-success (no fire-and-forget).
```

- [ ] **Step 2: Update bead descriptions** to the finalized design:

```bash
bd update v5-8me.6 --description "Slice 5.2 T2a: transport surface (BARRIER) — addChannel/removeChannel/sendMessage + onChannelMessage/onChannelStatus push callbacks on initAndSubscribe (mirror onMediaStatus). String-only bridge: NO envelope struct, NO converter fixture, NO CastDebug change. Add CastErrorCode 'alreadyRegistered'. Update all 3 drift surfaces (transport/types.ts, specs/CastTransport.nitro.ts, __fakes__/FakeCastTransport.ts — fake records + scriptable behaviors + emitChannelMessage/emitChannelStatus helpers; default addChannelBehavior emits initial status {true,true} before resolving), adapter + web stub, CastStore no-op callback placeholders, yarn specs (nitrogen) + commit nitrogen/generated. Native intentionally red until 2c/2d (T1a convention). Land inline on v5, push, then fan out."
bd update v5-8me.7 --description "Slice 5.2 T2b: TS — (C1) extract KeyedBus<K,V> (copy-on-emit) + retrofit CastStore lifecycle bus (behavior-preserving); StoreEvent gains channelStatus {namespace,connected,writable} + TS-only channelRemoved {namespace}; channel.slice.ts (Record<namespace,{connected,writable}>, live-gated like media.slice, seeds empty, clears on establish+teardown, ref-stable); CastStore namespace-keyed message bus (onChannelMessage — transient, never replayed, no dispatch loop); CastChannel.ts (generation-bound, assertActive, connected/writable from slice, single replace-on-set onMessage liveness-scoped, remove() frees the namespace synchronously — dispatches channelRemoved BEFORE the bridge call, so a hook remount can't self-collide (T1); CastSession.addChannel(ns, onMessage?) — urn:x-cast: prefix + reserved-media-ns + (T1) alreadyRegistered rejection + (A2) v4 console.warn on !connected; useCastChannel.ts. index.ts exports. jest vs FakeCastTransport. Migration-guide channels section + listener-ownership + platform-asymmetry note. Branches from T2a."
bd update v5-8me.8 --description "Slice 5.2 T2c: iOS — CastMessageChannel: GCKCastChannel subclass (compiler-checked overrides: didReceiveTextMessage/didConnect/didDisconnect/didChangeWritableState) forwarding to closures; HybridCastTransport registry [String: CastMessageChannel]; addChannel re-resolves currentCastSession per call (Invariant 1), rejects noSession/alreadyRegistered, emits REAL initial onChannelStatus (isConnected/isWritable — often false,false right after add, A2) BEFORE resolving; removeChannel idempotent; sendMessage via channel.sendTextMessage(_:error:) (verify exact bridged Swift signature against GCK headers); (A1) clearChannels() on onSessionInactive + dispose. XCTest CastMessageChannelTests (closure forwarding). Branches from T2a."
bd update v5-8me.9 --description "Slice 5.2 T2d: Android — Cast.MessageReceivedCallback registry mutableMapOf<String, callback>; addChannel re-resolves currentCastSession per call, rejects noSession/alreadyRegistered, session.setMessageReceivedCallbacks in try/catch, emits onChannelStatus(ns, true, true) ONCE on registration (v4 parity — SDK has no per-channel status callbacks, never updates); removeChannel idempotent; sendMessage awaits PendingResult<Status> and rejects typed CastError on non-success (A2-minor), tracked in pendingChannelResults for dispose-cancel; (A1) clearChannels(session) in onSessionEnded/onSessionSuspended + dispose. compileDebugKotlin + Robolectric suite green. Branches from T2a."
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-11-castchannel-design.md docs/superpowers/plans/2026-07-12-castchannel-implementation.md
git commit -m "docs(v5): CastChannel implementation plan + eng-review amendments (v5-8me.5)"
```

---

### Task 1: 2a — Transport surface (BARRIER, bead `v5-8me.6`)

Lands inline on `v5`. After this task: `yarn typescript` + `yarn test` + prettier green; **native intentionally does not compile** until Tasks 8/9 (the T1a/T4a convention — the PR is the authoritative native CI gate).

**Files:**
- Modify: `src/transport/types.ts` (initAndSubscribe signature + 3 methods)
- Modify: `src/types/CastError.ts` (add `alreadyRegistered`)
- Modify: `src/specs/CastTransport.nitro.ts` (mirror)
- Modify: `src/transport/CastTransport.ts` (adapter)
- Modify: `src/transport/CastTransport.web.ts` (unsupported stubs)
- Modify: `src/transport/__fakes__/FakeCastTransport.ts` (records + behaviors + emit helpers)
- Modify: `src/state/CastStore.ts` (two no-op callback placeholders so init compiles)
- Regenerate: `nitrogen/generated/**` via `yarn specs`

- [ ] **Step 1: `src/types/CastError.ts`** — add to the `CastErrorCode` union after `'appNotFound'`:

```ts
  /** A custom channel for this namespace is already registered (channels are register-once). */
  | 'alreadyRegistered'
```

- [ ] **Step 2: `src/transport/types.ts`** — extend `initAndSubscribe` (update its doc comment: "The three callbacks are persistent" → "The callbacks are persistent"):

```ts
  initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus) => void,
    onChannelMessage: (namespace: string, message: string) => void,
    onChannelStatus: (
      namespace: string,
      connected: boolean,
      writable: boolean
    ) => void
  ): Promise<InitialSnapshot>
```

and add a channel section between the device-level surface and the RemoteMediaClient section:

```ts
  // --- Custom channel surface (Phase 5.2) ---
  //
  // v4-parity custom namespaces (`urn:x-cast:…`). String-only bridge: messages
  // cross as plain strings both ways (objects are JSON.stringified in the TS
  // façade; inbound is the raw string GCK produced). Registration is
  // register-once per namespace (duplicate → `alreadyRegistered`; enforced in
  // the TS façade, re-checked natively). Each call re-resolves the current
  // session (Invariant 1); no live session rejects `noSession`. Inbound
  // messages and connection status stream back through the `onChannelMessage`
  // / `onChannelStatus` callbacks — messages are transient (never replayed,
  // never in the snapshot); status is state (the channel slice). The native
  // registry is cleared explicitly on session end/suspend/replace (A1).

  /**
   * Register a custom channel for `namespace` on the active session. Native
   * emits the initial `onChannelStatus` for the namespace *before* this
   * resolves, so an awaiting caller reads a populated status. The initial
   * status carries the real platform value: on iOS `connected` is often still
   * `false` immediately after registration (the virtual connection completes
   * asynchronously and streams an update when it does); Android reports
   * `{connected: true, writable: true}` once and never updates it (its SDK
   * has no per-channel status callbacks — v4 parity).
   */
  addChannel(namespace: string): Promise<void>
  /** Unregister the custom channel for `namespace`. Resolves if not registered. */
  removeChannel(namespace: string): Promise<void>
  /** Send a message on the custom channel for `namespace` (must be registered). */
  sendMessage(namespace: string, message: string): Promise<void>
```

- [ ] **Step 3: `src/specs/CastTransport.nitro.ts`** — mirror both changes:

```ts
  initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus) => void,
    onChannelMessage: (namespace: string, message: string) => void,
    onChannelStatus: (
      namespace: string,
      connected: boolean,
      writable: boolean
    ) => void
  ): Promise<InitialSnapshot>
```

```ts
  // Custom channel surface (Phase 5.2) — string-only bridge; mirrors
  // `CastTransportApi` (drift guard in `__fakes__/FakeCastTransport.ts`).
  // Inbound messages/status stream via `onChannelMessage` / `onChannelStatus`.
  addChannel(namespace: string): Promise<void>
  removeChannel(namespace: string): Promise<void>
  sendMessage(namespace: string, message: string): Promise<void>
```

- [ ] **Step 4: `src/transport/CastTransport.ts`** — forward the new callbacks and wrap the mutations:

```ts
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
```

```ts
  // Custom channels — same error-translation wrapper.
  addChannel: (namespace) => mutate(() => hybrid.addChannel(namespace)),
  removeChannel: (namespace) => mutate(() => hybrid.removeChannel(namespace)),
  sendMessage: (namespace, message) =>
    mutate(() => hybrid.sendMessage(namespace, message)),
```

- [ ] **Step 5: `src/transport/CastTransport.web.ts`** — after `setDeviceMuted: unsupported,`:

```ts
  addChannel: unsupported,
  removeChannel: unsupported,
  sendMessage: unsupported,
```

- [ ] **Step 6: `src/transport/__fakes__/FakeCastTransport.ts`** — capture callbacks, record calls, scriptable behaviors, emit helpers.

Add fields next to the existing recorded-call arrays:

```ts
  /** Recorded custom-channel calls (Phase 5.2), in call order. */
  readonly addChannelCalls: string[] = []
  readonly removeChannelCalls: string[] = []
  readonly sendMessageCalls: Array<{ namespace: string; message: string }> = []
```

Add behaviors next to the existing scriptable behaviors:

```ts
  /**
   * Scriptable channel behaviour. The default `addChannel` mirrors the native
   * contract — it emits the initial `onChannelStatus` for the namespace
   * *before* resolving (here the Android register-once `{true, true}` shape).
   * Override to script the iOS not-yet-connected case:
   * `t.addChannelBehavior = async (ns) => { t.emitChannelStatus(ns, false, false) }`.
   */
  addChannelBehavior: (namespace: string) => Promise<void> = async (
    namespace
  ) => {
    this.emitChannelStatus(namespace, true, true)
  }
  removeChannelBehavior: (namespace: string) => Promise<void> = async () => {}
  sendMessageBehavior: (namespace: string, message: string) => Promise<void> =
    async () => {}
```

Add private callback fields next to `onMediaStatus`:

```ts
  private onChannelMessage?: (namespace: string, message: string) => void
  private onChannelStatus?: (
    namespace: string,
    connected: boolean,
    writable: boolean
  ) => void
```

Extend `initAndSubscribe` (new params + capture):

```ts
  async initAndSubscribe(
    onState: (castState: CastState) => void,
    onDevices: (devices: Device[]) => void,
    onLifecycle: (event: SessionLifecycleEvent) => void,
    onMediaStatus: (status: MediaStatus) => void,
    onChannelMessage: (namespace: string, message: string) => void,
    onChannelStatus: (
      namespace: string,
      connected: boolean,
      writable: boolean
    ) => void
  ): Promise<InitialSnapshot> {
    this.initCount++
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    this.onMediaStatus = onMediaStatus
    this.onChannelMessage = onChannelMessage
    this.onChannelStatus = onChannelStatus
    return this.snapshot
  }
```

Add methods after `setDeviceMuted`:

```ts
  // --- Custom channel surface (Phase 5.2) ---

  async addChannel(namespace: string): Promise<void> {
    this.addChannelCalls.push(namespace)
    return this.addChannelBehavior(namespace)
  }

  async removeChannel(namespace: string): Promise<void> {
    this.removeChannelCalls.push(namespace)
    return this.removeChannelBehavior(namespace)
  }

  async sendMessage(namespace: string, message: string): Promise<void> {
    this.sendMessageCalls.push({ namespace, message })
    return this.sendMessageBehavior(namespace, message)
  }
```

In `dispose()` add:

```ts
    this.onChannelMessage = undefined
    this.onChannelStatus = undefined
```

Add emit helpers next to `emitMediaStatus`:

```ts
  /** Emit an inbound custom-channel message to the subscribed store. */
  emitChannelMessage(namespace: string, message: string): void {
    this.onChannelMessage?.(namespace, message)
  }

  /** Emit a custom-channel status update to the subscribed store. */
  emitChannelStatus(
    namespace: string,
    connected: boolean,
    writable: boolean
  ): void {
    this.onChannelStatus?.(namespace, connected, writable)
  }
```

- [ ] **Step 7: `src/state/CastStore.ts`** — make `init()` compile against the new signature (real wiring is Task 4):

```ts
      const snapshot = await this.transport.initAndSubscribe(
        (castState) => this.dispatch({ kind: 'state', castState }),
        (devices) => this.dispatch({ kind: 'devices', devices }),
        (event) => this.dispatchLifecycle(event),
        (status) => this.dispatch({ kind: 'mediaStatus', status }),
        () => {}, // onChannelMessage — wired to the channel message bus in 5.2b
        () => {} // onChannelStatus — dispatched as `channelStatus` in 5.2b
      )
```

- [ ] **Step 8: Regenerate nitrogen + verify**

```bash
yarn specs
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
```

Expected: codegen updates `nitrogen/generated/**` (new spec methods + 6-arg `initAndSubscribe`); tsc/jest/prettier all pass (the drift-guard assertion in the fake proves API ↔ spec ↔ fake alignment).

- [ ] **Step 9: Commit + push the barrier (inline on `v5`)**

```bash
git add src/ nitrogen/generated/
git commit -m "feat(v5): Phase 5 T2a — CastChannel transport surface (barrier) (v5-8me.6)

String-only bridge: addChannel/removeChannel/sendMessage + onChannelMessage/
onChannelStatus push callbacks on initAndSubscribe. All 3 drift surfaces +
adapter + web stub + fake (records, scriptable behaviors, emit helpers;
default addChannel emits initial status before resolving). New CastErrorCode
'alreadyRegistered' (T1). Nitrogen regenerated; native base intentionally
incomplete until 2c/2d (T1a convention)."
git push origin v5
```

**CHECK IN with the driver before fanning out** (per the epic plan).

---

### Task 2: 2b — `KeyedBus` + lifecycle-bus retrofit (C1)

Lane B starts here: `git checkout -b petrbela/p52-ts` from the Task 1 commit.

**Files:**
- Create: `src/state/keyedBus.ts`
- Test: `src/state/__tests__/keyedBus.test.ts`
- Modify: `src/state/CastStore.ts` (retrofit `busHandlers`)

- [ ] **Step 1: Write the failing test** — `src/state/__tests__/keyedBus.test.ts`:

```ts
import { KeyedBus } from '../keyedBus'

describe('KeyedBus', () => {
  it('routes emits to the subscribed key only', () => {
    const bus = new KeyedBus<string, number>()
    const a = jest.fn()
    const b = jest.fn()
    bus.subscribe('a', a)
    bus.subscribe('b', b)
    bus.emit('a', 1)
    expect(a).toHaveBeenCalledWith(1)
    expect(b).not.toHaveBeenCalled()
  })

  it('supports multiple handlers per key', () => {
    const bus = new KeyedBus<string, string>()
    const first = jest.fn()
    const second = jest.fn()
    bus.subscribe('k', first)
    bus.subscribe('k', second)
    bus.emit('k', 'msg')
    expect(first).toHaveBeenCalledWith('msg')
    expect(second).toHaveBeenCalledWith('msg')
  })

  it('unsubscribe removes only that handler', () => {
    const bus = new KeyedBus<string, number>()
    const kept = jest.fn()
    const removed = jest.fn()
    const off = bus.subscribe('k', removed)
    bus.subscribe('k', kept)
    off()
    bus.emit('k', 1)
    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledTimes(1)
  })

  it('a handler unsubscribing during emit does not skip the others (copy-on-emit)', () => {
    const bus = new KeyedBus<string, number>()
    const calls: string[] = []
    const off = bus.subscribe('k', () => {
      calls.push('first')
      off()
    })
    bus.subscribe('k', () => calls.push('second'))
    bus.emit('k', 0)
    expect(calls).toEqual(['first', 'second'])
  })

  it('emitting a key with no handlers is a no-op', () => {
    const bus = new KeyedBus<string, number>()
    expect(() => bus.emit('nobody', 1)).not.toThrow()
  })

  it('clear() drops every handler', () => {
    const bus = new KeyedBus<string, number>()
    const handler = jest.fn()
    bus.subscribe('k', handler)
    bus.clear()
    bus.emit('k', 1)
    expect(handler).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it — expect FAIL** (`Cannot find module '../keyedBus'`):

```bash
yarn test keyedBus
```

- [ ] **Step 3: Implement** — `src/state/keyedBus.ts`:

```ts
/**
 * Generic keyed multi-handler event bus: subscribe by key, emit to that key's
 * handlers. Handlers are copied before invocation (copy-on-emit), so a handler
 * that unsubscribes itself — or another handler — mid-emit cannot corrupt the
 * iteration.
 *
 * Backs both of the store's never-replayed event paths: the typed session
 * lifecycle bus (`CastStore.on`) and the Phase 5 per-namespace channel message
 * bus (`CastStore.onChannelMessage`). State replay is `getSnapshot`'s job —
 * nothing emitted through a bus is ever replayed to a late subscriber.
 */
export class KeyedBus<K, V> {
  private readonly handlers = new Map<K, Set<(value: V) => void>>()

  /** Subscribe to `key`; returns the unsubscribe function. */
  subscribe(key: K, handler: (value: V) => void): () => void {
    let set = this.handlers.get(key)
    if (!set) {
      set = new Set()
      this.handlers.set(key, set)
    }
    set.add(handler)
    return () => {
      set.delete(handler)
    }
  }

  /** Emit `value` to every handler subscribed to `key` (copy-on-emit). */
  emit(key: K, value: V): void {
    const set = this.handlers.get(key)
    if (!set) return
    for (const handler of [...set]) handler(value)
  }

  /** Drop every handler (store dispose). */
  clear(): void {
    this.handlers.clear()
  }
}
```

- [ ] **Step 4: Run it — expect PASS**: `yarn test keyedBus`

- [ ] **Step 5: Retrofit `CastStore`** (behavior-preserving). In `src/state/CastStore.ts`:

Replace the `busHandlers` field:

```ts
  private readonly lifecycleBus = new KeyedBus<
    SessionEventType,
    SessionLifecycleEvent
  >()
```

(add `import { KeyedBus } from './keyedBus'`). Replace `on()`:

```ts
  /** Subscribe to a single session-lifecycle event type. */
  on(
    type: SessionEventType,
    handler: (event: SessionLifecycleEvent) => void
  ): () => void {
    if (this.disposed) return () => {}
    return this.lifecycleBus.subscribe(type, handler)
  }
```

Replace `emit()`:

```ts
  private emit(event: SessionLifecycleEvent): void {
    this.lifecycleBus.emit(event.type, event)
  }
```

Replace `this.busHandlers.clear()` in `dispose()` with `this.lifecycleBus.clear()`.

- [ ] **Step 6: Full suite — expect PASS (retrofit is behavior-preserving)**:

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
```

- [ ] **Step 7: Commit**

```bash
git add src/state/keyedBus.ts src/state/__tests__/keyedBus.test.ts src/state/CastStore.ts
git commit -m "refactor(v5): extract KeyedBus and retrofit the lifecycle bus (C1, v5-8me.7)"
```

---

### Task 3: 2b — `channelStatus`/`channelRemoved` StoreEvents + `channel.slice`

**Files:**
- Modify: `src/state/slice.ts` (StoreEvent union)
- Create: `src/state/channel.slice.ts`
- Test: `src/state/__tests__/channel.slice.test.ts`

- [ ] **Step 1: Extend `StoreEvent`** in `src/state/slice.ts` (also update the doc comment's "(channel messages in P5)" aside — messages are NOT a StoreEvent; only status is):

```ts
export type StoreEvent =
  | { readonly kind: 'state'; readonly castState: CastState }
  | { readonly kind: 'devices'; readonly devices: Device[] }
  | { readonly kind: 'lifecycle'; readonly event: SessionLifecycleEvent }
  | { readonly kind: 'mediaStatus'; readonly status: MediaStatus }
  // P5.2 custom channels. Connection status is state (slice + snapshot-replay);
  // inbound channel *messages* are transient and deliberately NOT a StoreEvent —
  // they ride the store's namespace-keyed message bus and are never replayed.
  | {
      readonly kind: 'channelStatus'
      readonly namespace: string
      readonly connected: boolean
      readonly writable: boolean
    }
  // TS-only (dispatched by the CastChannel façade after removeChannel settles):
  // deletes the namespace's slice entry so register-once bookkeeping (T1)
  // frees the namespace for a later addChannel.
  | { readonly kind: 'channelRemoved'; readonly namespace: string }
```

- [ ] **Step 2: Write the failing slice test** — `src/state/__tests__/channel.slice.test.ts`:

```ts
import { channelSlice, type ChannelState } from '../channel.slice'
import type {
  Device,
  SessionInfo,
  SessionLifecycleEvent,
} from '../../transport/types'
import type { StoreEvent } from '../slice'

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: `Device ${id}`,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}
function session(id: string): SessionInfo {
  return { sessionId: id, device: device(id) }
}
const status = (
  namespace: string,
  connected = true,
  writable = true
): StoreEvent => ({ kind: 'channelStatus', namespace, connected, writable })
const lifecycle = (event: SessionLifecycleEvent): StoreEvent => ({
  kind: 'lifecycle',
  event,
})

const NS = 'urn:x-cast:com.example.a'
const NS_B = 'urn:x-cast:com.example.b'

function liveState(): ChannelState {
  return channelSlice.reduce(
    channelSlice.seed({
      castState: 'connected',
      playServicesState: 'success',
      devices: [],
    }),
    lifecycle({ type: 'started', session: session('s1') })
  )
}

describe('channel.slice', () => {
  it('seeds empty (idle without a session, live with one)', () => {
    const idle = channelSlice.seed({
      castState: 'notConnected',
      playServicesState: 'success',
      devices: [],
    })
    expect(idle).toEqual({ statuses: {}, live: false })
    const live = channelSlice.seed({
      castState: 'connected',
      playServicesState: 'success',
      devices: [],
      currentSession: session('s1'),
    })
    expect(live).toEqual({ statuses: {}, live: true })
  })

  it('channelStatus sets/replaces the namespace entry while live', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS, false, false))
    expect(state.statuses[NS]).toEqual({ connected: false, writable: false })
    state = channelSlice.reduce(state, status(NS, true, true))
    expect(state.statuses[NS]).toEqual({ connected: true, writable: true })
  })

  it('is ref-stable when the status is unchanged (Invariant 2)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS, true, true))
    const again = channelSlice.reduce(state, status(NS, true, true))
    expect(again).toBe(state)
  })

  it('drops a channelStatus while no session is live', () => {
    const idle = channelSlice.seed({
      castState: 'notConnected',
      playServicesState: 'success',
      devices: [],
    })
    expect(channelSlice.reduce(idle, status(NS))).toBe(idle)
  })

  it('channelRemoved deletes only that namespace (ref-stable when absent)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS))
    state = channelSlice.reduce(state, status(NS_B))
    const removed = channelSlice.reduce(state, {
      kind: 'channelRemoved',
      namespace: NS,
    })
    expect(removed.statuses[NS]).toBeUndefined()
    expect(removed.statuses[NS_B]).toEqual({ connected: true, writable: true })
    expect(
      channelSlice.reduce(removed, { kind: 'channelRemoved', namespace: NS })
    ).toBe(removed)
  })

  it('clears on teardown and on a new session (establish)', () => {
    let state = liveState()
    state = channelSlice.reduce(state, status(NS))
    const torn = channelSlice.reduce(state, lifecycle({ type: 'ended' }))
    expect(torn).toEqual({ statuses: {}, live: false })

    let state2 = liveState()
    state2 = channelSlice.reduce(state2, status(NS))
    const replaced = channelSlice.reduce(
      state2,
      lifecycle({ type: 'started', session: session('s2') })
    )
    expect(replaced).toEqual({ statuses: {}, live: true })
  })

  it('is ref-stable across teardown/establish when already empty', () => {
    const state = liveState()
    expect(
      channelSlice.reduce(
        state,
        lifecycle({ type: 'started', session: session('s2') })
      )
    ).toBe(state)
    const idle = channelSlice.reduce(state, lifecycle({ type: 'ended' }))
    expect(channelSlice.reduce(idle, lifecycle({ type: 'ended' }))).toBe(idle)
  })

  it('ignores unrelated events (same ref)', () => {
    const state = liveState()
    expect(
      channelSlice.reduce(state, { kind: 'state', castState: 'connected' })
    ).toBe(state)
  })
})
```

- [ ] **Step 3: Run it — expect FAIL** (`Cannot find module '../channel.slice'`): `yarn test channel.slice`

- [ ] **Step 4: Implement** — `src/state/channel.slice.ts`:

```ts
import {
  SESSION_ESTABLISH_TYPES,
  SESSION_TEARDOWN_TYPES,
} from './session.slice'
import type { Slice } from './slice'

export const CHANNEL_SLICE_KEY = 'channel'

/** Connection status of one registered custom channel (see the platform note). */
export interface ChannelStatus {
  readonly connected: boolean
  readonly writable: boolean
}

/**
 * Per-namespace connection status of every registered custom channel (P5.2).
 *
 * Status is *state* (a component mounting mid-session must read the current
 * `connected`/`writable`), so it lives here and replays via the slice —
 * unlike inbound channel *messages*, which are transient and ride the store's
 * message bus, never a slice. An entry also doubles as the register-once
 * bookkeeping (T1): `CastSession.addChannel` rejects `alreadyRegistered` while
 * the namespace has an entry; `CastChannel.remove()` dispatches
 * `channelRemoved` to free it.
 *
 * Platform asymmetry (documented in the guide): iOS streams real dynamic
 * values; Android emits `{connected: true, writable: true}` once at
 * registration and never updates (its SDK has no per-channel callbacks).
 */
export interface ChannelState {
  readonly statuses: Readonly<Record<string, ChannelStatus>>
  /**
   * Whether a live session currently exists — same derivation as the media
   * slice's `live` (same event lists), gating status application so a
   * `channelStatus` racing a teardown is dropped (Invariant 3).
   */
  readonly live: boolean
}

const EMPTY_STATUSES: Readonly<Record<string, ChannelStatus>> = Object.freeze(
  {}
)
const EMPTY_IDLE: ChannelState = { statuses: EMPTY_STATUSES, live: false }
const EMPTY_LIVE: ChannelState = { statuses: EMPTY_STATUSES, live: true }

/**
 * P5.2 slice: custom-channel connection status, bound to live-session presence.
 * Channels never outlive their session: cleared on teardown (GCK auto-removes
 * them natively) and on establishment (a new session starts with none; the app
 * re-adds).
 */
export const channelSlice: Slice<ChannelState> = {
  key: CHANNEL_SLICE_KEY,

  seed: (snapshot) => (snapshot.currentSession ? EMPTY_LIVE : EMPTY_IDLE),

  reduce: (state, event) => {
    if (event.kind === 'channelStatus') {
      // Drop a status arriving while no session is live — it would resurrect
      // a channel the teardown already cleared (same gate as the media slice).
      if (!state.live) return state
      const prev = state.statuses[event.namespace]
      if (
        prev &&
        prev.connected === event.connected &&
        prev.writable === event.writable
      ) {
        return state
      }
      return {
        statuses: Object.freeze({
          ...state.statuses,
          [event.namespace]: Object.freeze({
            connected: event.connected,
            writable: event.writable,
          }),
        }),
        live: true,
      }
    }

    if (event.kind === 'channelRemoved') {
      if (!(event.namespace in state.statuses)) return state
      const { [event.namespace]: _removed, ...rest } = state.statuses
      return { statuses: Object.freeze(rest), live: state.live }
    }

    if (event.kind === 'lifecycle') {
      const { type } = event.event
      if (SESSION_ESTABLISH_TYPES.has(type)) {
        const live = event.event.session != null
        const empty = Object.keys(state.statuses).length === 0
        if (empty && state.live === live) return state
        return live ? EMPTY_LIVE : EMPTY_IDLE
      }
      if (SESSION_TEARDOWN_TYPES.has(type)) {
        return Object.keys(state.statuses).length === 0 && !state.live
          ? state
          : EMPTY_IDLE
      }
    }

    return state
  },
}
```

- [ ] **Step 5: Run it — expect PASS**: `yarn test channel.slice`

- [ ] **Step 6: Full verification + commit**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/state/slice.ts src/state/channel.slice.ts src/state/__tests__/channel.slice.test.ts
git commit -m "feat(v5): channelStatus/channelRemoved StoreEvents + channel.slice (v5-8me.7)"
```

---

### Task 4: 2b — `CastStore` channel wiring (message bus + status dispatch + slice registration)

**Files:**
- Modify: `src/state/CastStore.ts`
- Test: extend `src/state/__tests__/CastStore.test.ts`

- [ ] **Step 1: Write the failing tests** — append to `src/state/__tests__/CastStore.test.ts` (match its existing `setup()` helper style; it constructs `new CastStore(new FakeCastTransport(...))` and awaits `store.ready`):

```ts
describe('channel message bus (P5.2 — transient, never replayed)', () => {
  const NS = 'urn:x-cast:com.example.a'
  const NS_B = 'urn:x-cast:com.example.b'

  it('routes onChannelMessage by namespace', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const a = jest.fn()
    const b = jest.fn()
    store.onChannelMessage(NS, a)
    store.onChannelMessage(NS_B, b)
    transport.emitChannelMessage(NS, 'hello')
    expect(a).toHaveBeenCalledWith('hello')
    expect(b).not.toHaveBeenCalled()
  })

  it('never replays messages to a late subscriber', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    transport.emitChannelMessage(NS, 'early')
    const late = jest.fn()
    store.onChannelMessage(NS, late)
    expect(late).not.toHaveBeenCalled()
    transport.emitChannelMessage(NS, 'now')
    expect(late).toHaveBeenCalledTimes(1)
    expect(late).toHaveBeenCalledWith('now')
  })

  it('a message is not state: no snapshot rebuild, no subscriber notify', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const listener = jest.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    transport.emitChannelMessage(NS, 'transient')
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
  })

  it('onChannelStatus dispatches into the channel slice', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    transport.emitLifecycle({
      type: 'started',
      session: { sessionId: 's1', device: device('d1') },
    })
    transport.emitChannelStatus(NS, true, false)
    const state = store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY)
    expect(state.statuses[NS]).toEqual({ connected: true, writable: false })
  })

  it('dispose drops message handlers', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready
    const handler = jest.fn()
    store.onChannelMessage(NS, handler)
    store.dispose()
    transport.emitChannelMessage(NS, 'late')
    expect(handler).not.toHaveBeenCalled()
    // subscribing after dispose is a no-op unsubscribe, like on()
    expect(typeof store.onChannelMessage(NS, jest.fn())).toBe('function')
  })
})
```

(Import `CHANNEL_SLICE_KEY, type ChannelState` from `../channel.slice` at the top; reuse the file's existing `device()` helper — if it has none, add the same `device()` helper used in `channel.slice.test.ts`.)

- [ ] **Step 2: Run — expect FAIL** (`store.onChannelMessage is not a function`): `yarn test CastStore`

- [ ] **Step 3: Implement in `src/state/CastStore.ts`:**

Register the slice in the constructor after `mediaSlice`:

```ts
    this.push(channelSlice)
```

(import `channelSlice` from `./channel.slice`). Add the bus field next to `lifecycleBus`:

```ts
  // P5.2 — inbound custom-channel messages. Deliberately a separate bus and a
  // dedicated path: messages are transient (never replayed, never state), so
  // they must not run the slice dispatch loop or touch the snapshot.
  private readonly channelMessageBus = new KeyedBus<string, string>()
```

Add the public subscribe method after `on()`:

```ts
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
```

Replace the two Task-1 placeholders in `init()`:

```ts
        (namespace, message) => this.channelMessageBus.emit(namespace, message),
        (namespace, connected, writable) =>
          this.dispatch({ kind: 'channelStatus', namespace, connected, writable })
```

Add to `dispose()` next to `lifecycleBus.clear()`:

```ts
    this.channelMessageBus.clear()
```

- [ ] **Step 4: Run — expect PASS**: `yarn test CastStore`

- [ ] **Step 5: Full verification + commit**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/state/CastStore.ts src/state/__tests__/CastStore.test.ts
git commit -m "feat(v5): CastStore channel message bus + channelStatus wiring (v5-8me.7)"
```

---

### Task 5: 2b — `CastChannel` façade + `CastSession.addChannel`

**Files:**
- Create: `src/api/CastChannel.ts`
- Modify: `src/api/CastSession.ts` (add `addChannel`)
- Test: `src/api/__tests__/channels.test.ts`

- [ ] **Step 1: Write the failing tests** — `src/api/__tests__/channels.test.ts`:

```ts
import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import { CastStore } from '../../state/CastStore'
import { SessionManager } from '../SessionManager'

// CastSession → RemoteMediaClient transitively pulls the native singleton;
// swap it for a fake-backed one (same pattern as facades.test.ts).
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

const NS = 'urn:x-cast:com.example.a'
const NS_B = 'urn:x-cast:com.example.b'

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: `Device ${id}`,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}
function session(id: string): SessionInfo {
  return { sessionId: id, device: device(id) }
}

async function setup() {
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  await store.ready
  transport.emitLifecycle({ type: 'started', session: session('s1') })
  const sessionManager = new SessionManager(store, transport)
  const castSession = sessionManager.getCurrentCastSession()!
  return { transport, store, sessionManager, castSession }
}

describe('CastSession.addChannel — validation', () => {
  it('rejects a namespace without the urn:x-cast: prefix', async () => {
    const { castSession, transport } = await setup()
    await expect(castSession.addChannel('com.example.a')).rejects.toMatchObject(
      { code: 'invalidParameter' }
    )
    expect(transport.addChannelCalls).toEqual([])
  })

  it('rejects the reserved media namespace', async () => {
    const { castSession } = await setup()
    await expect(
      castSession.addChannel('urn:x-cast:com.google.cast.media')
    ).rejects.toMatchObject({ code: 'invalidParameter' })
  })

  it('rejects a duplicate namespace with alreadyRegistered (T1)', async () => {
    const { castSession, transport } = await setup()
    await castSession.addChannel(NS)
    await expect(castSession.addChannel(NS)).rejects.toMatchObject({
      code: 'alreadyRegistered',
    })
    expect(transport.addChannelCalls).toEqual([NS]) // second never hit the bridge
  })

  it('rejects noSession when the session is stale', async () => {
    const { castSession, transport } = await setup()
    transport.emitLifecycle({ type: 'ended' })
    await expect(castSession.addChannel(NS)).rejects.toMatchObject({
      code: 'noSession',
    })
  })
})

describe('CastSession.addChannel — creation (A2)', () => {
  it('resolves a channel with populated connected/writable', async () => {
    const { castSession } = await setup()
    const channel = await castSession.addChannel(NS)
    expect(channel.namespace).toBe(NS)
    expect(channel.connected).toBe(true)
    expect(channel.writable).toBe(true)
  })

  it('warns when the initial status is not connected (iOS shape)', async () => {
    const { castSession, transport } = await setup()
    transport.addChannelBehavior = async (ns) => {
      transport.emitChannelStatus(ns, false, false)
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const channel = await castSession.addChannel(NS)
    expect(channel.connected).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain(NS)
    warn.mockRestore()
  })

  it('does not warn when connected', async () => {
    const { castSession } = await setup()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await castSession.addChannel(NS)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('CastChannel — messages', () => {
  it('routes inbound messages by namespace to the single listener', async () => {
    const { castSession, transport } = await setup()
    const onA = jest.fn()
    const channelA = await castSession.addChannel(NS, onA)
    await castSession.addChannel(NS_B, jest.fn())
    transport.emitChannelMessage(NS, '{"hello":"world"}')
    expect(onA).toHaveBeenCalledWith('{"hello":"world"}')
    transport.emitChannelMessage(NS_B, 'other')
    expect(onA).toHaveBeenCalledTimes(1)
    void channelA
  })

  it('onMessage replaces the previous listener; offMessage clears it', async () => {
    const { castSession, transport } = await setup()
    const first = jest.fn()
    const second = jest.fn()
    const channel = await castSession.addChannel(NS, first)
    channel.onMessage(second)
    transport.emitChannelMessage(NS, 'm1')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('m1')
    channel.offMessage()
    transport.emitChannelMessage(NS, 'm2')
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('sendMessage stringifies objects and passes strings through (v4)', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    await channel.sendMessage({ hello: 'world' })
    await channel.sendMessage('raw')
    expect(transport.sendMessageCalls).toEqual([
      { namespace: NS, message: '{"hello":"world"}' },
      { namespace: NS, message: 'raw' },
    ])
  })
})

describe('CastChannel — lifecycle (Invariant 3)', () => {
  it('sendMessage/remove reject noSession on a stale channel, before the bridge', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    await expect(channel.sendMessage('x')).rejects.toMatchObject({
      code: 'noSession',
    })
    await expect(channel.remove()).rejects.toMatchObject({ code: 'noSession' })
    expect(transport.sendMessageCalls).toEqual([])
    expect(transport.removeChannelCalls).toEqual([])
  })

  it('connected/writable read undefined once stale (slice cleared / gated)', async () => {
    const { castSession, transport } = await setup()
    const channel = await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    expect(channel.connected).toBeUndefined()
    expect(channel.writable).toBeUndefined()
  })

  it('a stale channel never delivers a later session’s messages, even for the same namespace', async () => {
    const { castSession, transport, sessionManager } = await setup()
    const staleListener = jest.fn()
    await castSession.addChannel(NS, staleListener)
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    // The new session re-registers the same namespace.
    const fresh = sessionManager.getCurrentCastSession()!
    const freshListener = jest.fn()
    await fresh.addChannel(NS, freshListener)
    transport.emitChannelMessage(NS, 'for-s2')
    expect(staleListener).not.toHaveBeenCalled()
    expect(freshListener).toHaveBeenCalledWith('for-s2')
  })

  it('remove() unregisters, frees the namespace, and drops the listener', async () => {
    const { castSession, transport, store } = await setup()
    const listener = jest.fn()
    const channel = await castSession.addChannel(NS, listener)
    await channel.remove()
    expect(transport.removeChannelCalls).toEqual([NS])
    transport.emitChannelMessage(NS, 'after-remove')
    expect(listener).not.toHaveBeenCalled()
    // channelRemoved freed the namespace → re-add succeeds (T1 bookkeeping).
    await expect(castSession.addChannel(NS)).resolves.toBeDefined()
    void store
  })

  it('teardown clears the slice so the namespace is re-addable in a new session', async () => {
    const { castSession, transport, sessionManager } = await setup()
    await castSession.addChannel(NS)
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    const fresh = sessionManager.getCurrentCastSession()!
    await expect(fresh.addChannel(NS)).resolves.toBeDefined()
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`castSession.addChannel is not a function`): `yarn test channels`

- [ ] **Step 3: Implement `src/api/CastChannel.ts`:**

```ts
import type { CastError, CastTransportApi } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import {
  CHANNEL_SLICE_KEY,
  type ChannelState,
  type ChannelStatus,
} from '../state/channel.slice'

/** Custom channel namespaces must start with this prefix (v4 parity). */
export const CAST_NAMESPACE_PREFIX = 'urn:x-cast:'
/** GCK's own media namespace — reserved, cannot be registered (v4 parity). */
export const RESERVED_MEDIA_NAMESPACE = 'urn:x-cast:com.google.cast.media'

/**
 * A channel for sending custom messages between this sender and the Cast
 * receiver, created via {@link CastSession.addChannel} (or the
 * {@link useCastChannel} hook). Use when you've built a custom receiver and
 * want to communicate with it.
 *
 * Like {@link CastSession}, a channel is **generation-bound** (Invariant 3): it
 * belongs to the session that was live when it was added. Channels are
 * auto-removed natively when the session ends, so once that session is gone
 * this handle is stale — `sendMessage`/`remove` reject `noSession` before
 * crossing the bridge, `connected`/`writable` read `undefined`, and a retained
 * message listener can never receive a later session's messages (even if the
 * same namespace is re-registered).
 *
 * `onMessage` holds a **single listener, replace-on-set** (v4 semantics): a
 * channel is a pipe, not a broadcast. Messages are always delivered as the raw
 * string received — call `JSON.parse` yourself if your receiver sends JSON.
 *
 * @see [Custom Channels](../../guides/custom-channels)
 */
export class CastChannel {
  /** The channel's custom namespace (starts with `urn:x-cast:`). */
  readonly namespace: string

  private readonly store: CastStore
  private readonly transport: CastTransportApi
  private readonly generation: number
  private offMessageFn: (() => void) | null = null

  /** @internal Created by {@link CastSession.addChannel} — do not construct directly. */
  constructor(
    store: CastStore,
    transport: CastTransportApi,
    namespace: string,
    generation: number
  ) {
    this.store = store
    this.transport = transport
    this.namespace = namespace
    this.generation = generation
  }

  /** Whether this channel still belongs to the current live session. */
  get isActive(): boolean {
    return this.store.getCurrentGeneration() === this.generation
  }

  /**
   * Whether this channel is currently connected, or `undefined` when the
   * channel (or its session) is gone. iOS reports live values — often `false`
   * right after {@link CastSession.addChannel} (the connection completes
   * asynchronously); Android always reports `true` (register-once, v4 parity).
   */
  get connected(): boolean | undefined {
    return this.status()?.connected
  }

  /** Whether this channel is currently writable (same platform note as `connected`). */
  get writable(): boolean | undefined {
    return this.status()?.writable
  }

  private status(): ChannelStatus | undefined {
    if (!this.isActive) return undefined
    return this.store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
      this.namespace
    ]
  }

  private assertActive(): void {
    if (!this.isActive) {
      const error: CastError = {
        code: 'noSession',
        message: 'This Cast channel’s session has ended.',
      }
      throw error
    }
  }

  /**
   * Send a message to the connected Cast receiver on this channel. Objects are
   * `JSON.stringify`ed (v4 parity); strings pass through unchanged. Note that
   * by default a custom web receiver parses messages as JSON — send objects
   * unless you've configured the namespace as `STRING`.
   *
   * Settles when the platform accepts/rejects the send (v4 fire-and-forgot on
   * Android); rejects a typed {@link CastError} (`noSession` once stale).
   */
  async sendMessage(message: object | string): Promise<void> {
    this.assertActive()
    return this.transport.sendMessage(
      this.namespace,
      typeof message === 'string' ? message : JSON.stringify(message)
    )
  }

  /**
   * Register the message listener, **replacing** any previous one (v4 parity —
   * a channel holds at most one listener; see the listener-ownership note in
   * the guide). The subscription is liveness-scoped: once this channel is
   * stale it stops delivering and drops itself.
   */
  onMessage(listener: (message: string) => void): void {
    this.offMessage()
    if (!this.isActive) return
    this.offMessageFn = this.store.onChannelMessage(
      this.namespace,
      (message) => {
        // Stale (session changed): drop the subscription instead of delivering
        // a later session's message for a re-registered namespace.
        if (!this.isActive) {
          this.offMessage()
          return
        }
        listener(message)
      }
    )
  }

  /** Unregister the message listener. */
  offMessage(): void {
    this.offMessageFn?.()
    this.offMessageFn = null
  }

  /**
   * Remove the channel when it's no longer needed; the namespace becomes
   * registrable again. (Channels are also auto-removed when the session ends.)
   */
  async remove(): Promise<void> {
    this.assertActive()
    this.offMessage()
    // Free the namespace SYNCHRONOUSLY, before the bridge call (T1): an
    // immediate re-add (e.g. a `useCastChannel` remount) must pass the
    // register-once check without awaiting the removal. Ordering stays safe on
    // both sides — the native main-thread queue processes this removeChannel
    // before any subsequently-issued addChannel. (`removeChannel` is idempotent
    // and effectively infallible, so the optimistic free cannot strand state;
    // a teardown clears the slice wholesale anyway.)
    this.store.dispatch({ kind: 'channelRemoved', namespace: this.namespace })
    await this.transport.removeChannel(this.namespace)
  }
}
```

- [ ] **Step 4: Implement `CastSession.addChannel`** — in `src/api/CastSession.ts`, add the imports:

```ts
import {
  CastChannel,
  CAST_NAMESPACE_PREFIX,
  RESERVED_MEDIA_NAMESPACE,
} from './CastChannel'
import { CHANNEL_SLICE_KEY, type ChannelState } from '../state/channel.slice'
```

and the method after `getClient()`:

```ts
  // --- custom channels (Phase 5.2) ---

  /**
   * Add a custom channel for `namespace` to this session and return its
   * {@link CastChannel}. The namespace must start with `urn:x-cast:` and is
   * register-once: adding a namespace that is already registered rejects
   * `alreadyRegistered` — remove the existing channel first (or lift the
   * channel to a common parent; see the guide).
   *
   * Resolves once native has registered the channel and reported its initial
   * status, so `channel.connected` is populated — but not necessarily `true`:
   * on iOS the connection completes asynchronously, and a receiver with no
   * listener for the namespace never connects (a `console.warn` flags this,
   * as in v4).
   *
   * @param namespace custom channel identifier starting with `urn:x-cast:`.
   * @param onMessage optional message listener (equivalent to `channel.onMessage`).
   */
  async addChannel(
    namespace: string,
    onMessage?: (message: string) => void
  ): Promise<CastChannel> {
    this.assertActive()
    if (!namespace.startsWith(CAST_NAMESPACE_PREFIX)) {
      const error: CastError = {
        code: 'invalidParameter',
        message: `Custom channel namespaces must start with "${CAST_NAMESPACE_PREFIX}" (got "${namespace}").`,
      }
      throw error
    }
    if (namespace === RESERVED_MEDIA_NAMESPACE) {
      const error: CastError = {
        code: 'invalidParameter',
        message: `The namespace "${RESERVED_MEDIA_NAMESPACE}" is reserved. Please use a different name.`,
      }
      throw error
    }
    const registered =
      this.store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
        namespace
      ]
    if (registered) {
      const error: CastError = {
        code: 'alreadyRegistered',
        message: `A channel for "${namespace}" is already registered (channels are register-once per namespace). Remove the existing channel first.`,
      }
      throw error
    }

    await this.transport.addChannel(namespace)

    const channel = new CastChannel(
      this.store,
      this.transport,
      namespace,
      this.generation
    )
    if (onMessage) channel.onMessage(onMessage)
    if (!channel.connected) {
      // v4-parity hint (A2): the most common cause is a receiver that never
      // registered a listener for this namespace.
      console.warn(
        `Channel ${namespace} is not connected. Make sure a session is established and you've set a listener in your custom receiver: https://developers.google.com/cast/docs/web_receiver/core_features#custom_messages`
      )
    }
    return channel
  }
```

- [ ] **Step 5: Run — expect PASS**: `yarn test channels`

- [ ] **Step 6: Full verification + commit**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/api/CastChannel.ts src/api/CastSession.ts src/api/__tests__/channels.test.ts
git commit -m "feat(v5): CastChannel façade + CastSession.addChannel (v5-8me.7)"
```

---

### Task 6: 2b — `useCastChannel` hook

**Files:**
- Create: `src/api/useCastChannel.ts`
- Test: `src/api/__tests__/useCastChannel.test.ts`

- [ ] **Step 1: Write the failing tests** — `src/api/__tests__/useCastChannel.test.ts` (react-test-renderer + singleton mock, same pattern as `mediaHooks.test.ts`):

```ts
import * as React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { Device, SessionInfo } from '../../transport/types'
import type { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import { castTransport } from '../../state/castStore.singleton'
import type { CastChannel } from '../CastChannel'
import { useCastChannel } from '../useCastChannel'

jest.mock('../../state/castStore.singleton', () => {
  const { CastStore } = require('../../state/CastStore')
  const {
    FakeCastTransport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  return { castStore: store, castTransport: transport }
})

const transport = castTransport as unknown as FakeCastTransport
const NS = 'urn:x-cast:com.example.a'
const NS_B = 'urn:x-cast:com.example.b'

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: `Device ${id}`,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}
function session(id: string): SessionInfo {
  return { sessionId: id, device: device(id) }
}

let latest: CastChannel | null = null
function Probe({
  namespace,
  onMessage,
}: {
  namespace: string
  onMessage?: (message: string) => void
}) {
  latest = useCastChannel(namespace, onMessage)
  return null
}

/** Flush effects + the addChannel/remove promise chains. */
async function flush() {
  await act(async () => {})
}

beforeEach(async () => {
  latest = null
  transport.addChannelCalls.length = 0
  transport.removeChannelCalls.length = 0
  await flush()
})

afterEach(() => {
  act(() => {
    transport.emitLifecycle({ type: 'ended' })
  })
})

describe('useCastChannel', () => {
  it('is null with no session and adds the channel once one is live', async () => {
    const renderer = TestRenderer.create(<Probe namespace={NS} />)
    await flush()
    expect(latest).toBeNull()

    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(transport.addChannelCalls).toEqual([NS])
    expect(latest).not.toBeNull()
    expect(latest!.namespace).toBe(NS)
    expect(latest!.connected).toBe(true)
    renderer.unmount()
  })

  it('wires onMessage through the hook', async () => {
    const onMessage = jest.fn()
    const renderer = TestRenderer.create(
      <Probe namespace={NS} onMessage={onMessage} />
    )
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => {
      transport.emitChannelMessage(NS, 'hi')
    })
    expect(onMessage).toHaveBeenCalledWith('hi')
    renderer.unmount()
  })

  it('removes the channel on unmount', async () => {
    const renderer = TestRenderer.create(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    renderer.unmount()
    await act(async () => {})
    expect(transport.removeChannelCalls).toEqual([NS])
  })

  it('a remount on the same namespace does not self-collide (T1)', async () => {
    const first = TestRenderer.create(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    first.unmount()
    // Immediately remount — remove() frees the namespace synchronously (T1),
    // so the re-add must not reject `alreadyRegistered` against its predecessor.
    const second = TestRenderer.create(<Probe namespace={NS} />)
    await flush()
    await flush()
    expect(latest).not.toBeNull()
    expect(transport.addChannelCalls).toEqual([NS, NS])
    expect(transport.removeChannelCalls).toEqual([NS])
    second.unmount()
  })

  it('switches channels when the namespace changes', async () => {
    const renderer = TestRenderer.create(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    act(() => {
      renderer.update(<Probe namespace={NS_B} />)
    })
    await flush()
    await flush()
    expect(transport.removeChannelCalls).toEqual([NS])
    expect(transport.addChannelCalls).toEqual([NS, NS_B])
    expect(latest!.namespace).toBe(NS_B)
    renderer.unmount()
  })

  it('drops to null when the session ends', async () => {
    const renderer = TestRenderer.create(<Probe namespace={NS} />)
    act(() => {
      transport.emitLifecycle({ type: 'started', session: session('s1') })
    })
    await flush()
    expect(latest).not.toBeNull()
    act(() => {
      transport.emitLifecycle({ type: 'ended' })
    })
    await flush()
    expect(latest).toBeNull()
    renderer.unmount()
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '../useCastChannel'`): `yarn test useCastChannel`

- [ ] **Step 3: Implement** — `src/api/useCastChannel.ts`:

```ts
import { useEffect, useState, useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { CastContext } from './CastContext'
import type { CastChannel } from './CastChannel'

/**
 * Hook that establishes a custom {@link CastChannel} on the current session.
 *
 * The channel is added when a session is live, removed on unmount and when the
 * session or `namespace` changes, and re-created on the next session. Passing
 * `onMessage` makes the hook the owner of the channel's **single** message
 * listener (replace-on-set, v4 parity) — do not also call `channel.onMessage`
 * elsewhere, or the two will clobber each other.
 *
 * Note that a namespace can only be registered once at a time. To use a
 * channel from multiple screens, lift the hook to a common parent (or manage
 * the channel in a global store) — see the Custom Channels guide.
 *
 * @param namespace custom namespace starting with `urn:x-cast:`.
 * @param onMessage listener invoked with each raw message string received.
 * @returns the channel, or `null` while there is no session (or during setup).
 *
 * @example
 * ```js
 * import { useCastChannel } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const channel = useCastChannel(
 *     'urn:x-cast:com.example.custom',
 *     useCallback((message) => console.log('received', message), [])
 *   )
 *   // later: channel?.sendMessage({ hello: 'world' })
 * }
 * ```
 */
export function useCastChannel(
  namespace: string,
  onMessage?: (message: string) => void
): CastChannel | null {
  // Memoized per generation by SessionManager → ref-stable across re-renders,
  // changes exactly when the session changes.
  const castSession = useSyncExternalStore(castStore.subscribe, () =>
    CastContext.getSessionManager().getCurrentCastSession()
  )
  const [channel, setChannel] = useState<CastChannel | null>(null)

  useEffect(() => {
    if (!castSession) {
      setChannel(null)
      return
    }
    let active = true
    let created: CastChannel | null = null
    castSession
      .addChannel(namespace)
      .then((c) => {
        if (active) {
          created = c
          setChannel(c)
        } else {
          // Unmounted while adding — undo immediately.
          void c.remove().catch(() => {})
        }
      })
      .catch(() => {
        // Session ended mid-add, or the namespace is registered elsewhere
        // (register-once — see the guide's lift-to-parent note).
        if (active) setChannel(null)
      })
    return () => {
      active = false
      setChannel(null)
      // `remove()` frees the namespace synchronously (T1), so a remount /
      // namespace change can re-add immediately without self-colliding. It
      // rejects noSession once the session already ended (native auto-removed
      // the channel with it) — safe to swallow.
      void created?.remove().catch(() => {})
    }
  }, [castSession, namespace])

  useEffect(() => {
    if (!channel || !onMessage) return
    channel.onMessage(onMessage)
    return () => channel.offMessage()
  }, [channel, onMessage])

  return channel
}
```

- [ ] **Step 4: Run — expect PASS**: `yarn test useCastChannel`

- [ ] **Step 5: Full verification + commit**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/api/useCastChannel.ts src/api/__tests__/useCastChannel.test.ts
git commit -m "feat(v5): useCastChannel hook (v5-8me.7)"
```

---

### Task 7: 2b — Public exports + docs

**Files:**
- Modify: `src/index.ts`
- Modify: `docs/guides/migrating-v4-to-v5.md`
- Modify: `docs/guides/custom-channels.md`

- [ ] **Step 1: `src/index.ts`** — after the `CastSession` export line:

```ts
export { CastChannel } from './api/CastChannel'
```

and after `useStreamPosition`:

```ts
export { useCastChannel } from './api/useCastChannel'
```

- [ ] **Step 2: Migration guide** — in `docs/guides/migrating-v4-to-v5.md`, insert this section before "Deferred to later phases", and delete the `- Custom channels (…) — **Phase 5**` bullet from the deferred list:

```markdown
## Custom channels

`CastSession.addChannel` / `CastChannel` / `useCastChannel` keep their v4 shape,
with these changes:

- **Messages are strings.** `onMessage` always delivers the raw string received
  from the receiver — call `JSON.parse` yourself if your receiver sends JSON
  (v4's listener type suggested parsed objects, but it delivered strings too).
  `sendMessage` still accepts an object (JSON.stringified for you) or a string,
  and now settles with a typed `CastError` instead of silently failing.
- **`addChannel` rejects on a duplicate namespace.** Channels are register-once
  per namespace (true in v4 as well, where a second registration silently broke
  the first); v5 makes it explicit with `CastError` code `alreadyRegistered`.
  Remove the existing channel first, or lift the channel to a common parent —
  see the [Custom Channels guide](../custom-channels).
- **Single message listener (unchanged, now documented).** `channel.onMessage`
  replaces any previous listener, and `useCastChannel`'s `onMessage` parameter
  owns that one listener — passing `onMessage` to the hook *and* calling
  `channel.onMessage` elsewhere clobbers whichever came first.
- **`connected` / `writable` reflect the platform.** iOS reports live values —
  often `connected: false` immediately after `addChannel` (the channel connects
  asynchronously; a `console.warn` flags a receiver with no listener for the
  namespace, as in v4). Android's SDK has no per-channel status callbacks: it
  reports `{connected: true, writable: true}` once at registration and never
  updates — exactly v4's hardcoded values.
- **Stale channels reject instead of crashing.** Like `CastSession`, a
  `CastChannel` retained across a disconnect rejects `noSession` on
  `sendMessage` / `remove` (channels are auto-removed with their session), and
  its retained listener can never receive a later session's messages.
```

- [ ] **Step 3: Custom-channels guide** — in `docs/guides/custom-channels.md`, after the "To process incoming messages, add a listener:" code block, add:

```markdown
> The message is always delivered as the **raw string** received from the
> receiver — if your receiver sends JSON, parse it with `JSON.parse(message)`.
```

- [ ] **Step 4: Full verification + commit**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
git add src/index.ts docs/guides/migrating-v4-to-v5.md docs/guides/custom-channels.md
git commit -m "feat(v5): export CastChannel/useCastChannel + channels migration docs (v5-8me.7)"
git push origin petrbela/p52-ts
```

---

### Task 8: 2c — iOS (`GCKCastChannel` subclass + registry, bead `v5-8me.8`)

Lane C: `git checkout -b petrbela/p52-ios` from the Task 1 barrier commit.

**Files:**
- Create: `ios/NitroGoogleCast/CastMessageChannel.swift`
- Modify: `ios/NitroGoogleCast/HybridCastTransport.swift`
- Test: `example/ios/NitroGoogleCastTests/CastMessageChannelTests.swift`

**Before coding:** verify the exact bridged Swift signatures of `GCKCastChannel`'s
`didReceiveTextMessage:` / `didConnect` / `didDisconnect` / `didChangeWritableState:`
and `sendTextMessage:error:` against the installed GCK headers
(`example/ios/Pods/google-cast-sdk*/.../GCKCastChannel.h`). Unlike the optional
`GCKSessionManagerListener` selectors, these are **base-class overrides**, so the
`override` keyword makes the compiler reject a wrong name — but `sendTextMessage`'s
error-pointer bridging must be checked by hand.

- [ ] **Step 1: `ios/NitroGoogleCast/CastMessageChannel.swift`:**

```swift
import Foundation
import GoogleCast

/// A registered custom channel: `GCKCastChannel` subclass forwarding inbound
/// text messages and connection-status changes to closures (Phase 5.2).
///
/// Unlike the `GCKSessionManagerListener` adapters, these are base-class
/// *overrides* (not optional protocol selectors), so a wrong signature fails to
/// compile — no silent-miss hazard. The transport owns the single strong
/// reference per namespace and clears its registry on session end/suspend (A1).
final class CastMessageChannel: GCKCastChannel {
  private let onMessage: (String) -> Void
  /// (connected, writable) — emitted on every connect/disconnect/writable change.
  private let onStatus: (Bool, Bool) -> Void

  init(
    namespace: String,
    onMessage: @escaping (String) -> Void,
    onStatus: @escaping (Bool, Bool) -> Void
  ) {
    self.onMessage = onMessage
    self.onStatus = onStatus
    super.init(namespace: namespace)
  }

  override func didReceiveTextMessage(_ message: String) {
    onMessage(message)
  }

  override func didConnect() {
    emitStatus()
  }

  override func didDisconnect() {
    emitStatus()
  }

  override func didChangeWritableState(_ isWritable: Bool) {
    emitStatus()
  }

  /// Read the live GCK properties rather than trusting callback arguments —
  /// one path for all three status events.
  private func emitStatus() {
    onStatus(isConnected, isWritable)
  }
}
```

- [ ] **Step 2: `HybridCastTransport.swift` — state + init.** Add fields next to `onMediaStatus`:

```swift
  private var onChannelMessage: ((String, String) -> Void)?
  private var onChannelStatus: ((String, Bool, Bool) -> Void)?
  // Registered custom channels by namespace (Phase 5.2). The transport owns the
  // single strong reference per channel; cleared explicitly on session
  // end/suspend/replace and on dispose (A1), so a dead session's channels can
  // never leak into the next one. Main thread only.
  private var channels: [String: CastMessageChannel] = [:]
```

Extend `initAndSubscribe` to the generated 6-callback signature and store both:

```swift
  func initAndSubscribe(
    onState: @escaping (_ castState: CastState) -> Void,
    onDevices: @escaping (_ devices: [Device]) -> Void,
    onLifecycle: @escaping (_ event: SessionLifecycleEvent) -> Void,
    onMediaStatus: @escaping (_ status: MediaStatus) -> Void,
    onChannelMessage: @escaping (_ namespace: String, _ message: String) -> Void,
    onChannelStatus: @escaping (_ namespace: String, _ connected: Bool, _ writable: Bool) -> Void
  ) throws -> Promise<InitialSnapshot> {
    self.onState = onState
    self.onDevices = onDevices
    self.onLifecycle = onLifecycle
    self.onMediaStatus = onMediaStatus
    self.onChannelMessage = onChannelMessage
    self.onChannelStatus = onChannelStatus
    // … (rest of the existing body unchanged)
```

(Match the exact parameter labels nitrogen generated in
`nitrogen/generated/ios/swift/HybridCastTransportSpec.swift` — copy them from there.)

- [ ] **Step 3: Registry lifecycle (A1).** In the `CastSessionListener` construction inside `attachObservers`, add `clearChannels()` to the inactive path:

```swift
      onSessionInactive: { [weak self] in
        self?.detachMediaListener()
        self?.detachDeviceStatusListener()
        self?.clearChannels()
        self?.flushPendingRequests(code: "interrupted", message: "The Cast session ended.")
      })
```

Add the helper next to `detachDeviceStatusListener()`:

```swift
  /// Drop every registered custom channel (A1). Called on session end/suspend
  /// and on dispose. Removes from the live session when one still exists
  /// (`willEnd` fires while it does); otherwise GCK already dropped the channel
  /// with the session and we only release our strong refs.
  private func clearChannels() {
    guard !channels.isEmpty else { return }
    let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession
    for channel in channels.values { session?.remove(channel) }
    channels.removeAll()
  }
```

In `dispose()` add, next to the other detaches:

```swift
      self.clearChannels()
```

and with the other callback nils:

```swift
      self.onChannelMessage = nil
      self.onChannelStatus = nil
```

- [ ] **Step 4: The three mutations.** Add after the device volume/mute section:

```swift
  // MARK: - custom channels (Phase 5.2 — registry owned here, Invariant 1 for the session)

  func addChannel(namespace: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession
      else {
        promise.reject(
          withError: castRejection(
            code: "noSession", message: "There is no active Cast session.", nativeCode: nil))
        return
      }
      guard self.channels[namespace] == nil else {
        promise.reject(
          withError: castRejection(
            code: "alreadyRegistered",
            message: "A channel for \(namespace) is already registered.", nativeCode: nil))
        return
      }
      let channel = CastMessageChannel(
        namespace: namespace,
        onMessage: { [weak self] message in self?.onChannelMessage?(namespace, message) },
        onStatus: { [weak self] connected, writable in
          self?.onChannelStatus?(namespace, connected, writable)
        })
      session.add(channel)
      self.channels[namespace] = channel
      // Initial status BEFORE resolving, so an awaiting façade reads a
      // populated value. This is the REAL current value (A2): `isConnected` is
      // often still false here — the virtual connection completes async and
      // `didConnect` streams the update when it does.
      self.onChannelStatus?(namespace, channel.isConnected, channel.isWritable)
      promise.resolve(withResult: ())
    }
    return promise
  }

  func removeChannel(namespace: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      if let channel = self.channels.removeValue(forKey: namespace) {
        // Best-effort: the session may already be gone (GCK dropped the
        // channel with it); removing from a live one keeps GCK in sync.
        GCKCastContext.sharedInstance().sessionManager.currentCastSession?.remove(channel)
      }
      promise.resolve(withResult: ())  // idempotent — not-registered resolves
    }
    return promise
  }

  func sendMessage(namespace: String, message: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard let channel = self.channels[namespace] else {
        promise.reject(
          withError: castRejection(
            code: "invalidRequest",
            message: "No channel registered for \(namespace) — call addChannel first.",
            nativeCode: nil))
        return
      }
      var error: GCKError?
      channel.sendTextMessage(message, error: &error)
      if let error {
        // Reuse the transport's GCKError → CastError code mapping (same one the
        // request delegate uses) so send failures reject typed codes.
        promise.reject(
          withError: castRejection(
            code: "failed", message: error.localizedDescription,
            nativeCode: Double(error.code)))
      } else {
        promise.resolve(withResult: ())
      }
    }
    return promise
  }
```

(If `CastRequestDelegate`/`castRejection` already expose a GCKError→code mapper,
use it instead of the hardcoded `"failed"`; match the existing reject-site style
and `nativeCode` type exactly.)

- [ ] **Step 5: XCTest** — `example/ios/NitroGoogleCastTests/CastMessageChannelTests.swift` (match the import/target setup of `DeviceStatusListenerSelectorTests.swift`):

```swift
import GoogleCast
import XCTest

@testable import NitroGoogleCast

final class CastMessageChannelTests: XCTestCase {
  func testForwardsTextMessages() {
    var received: [String] = []
    let channel = CastMessageChannel(
      namespace: "urn:x-cast:test",
      onMessage: { received.append($0) },
      onStatus: { _, _ in })
    channel.didReceiveTextMessage("hello")
    XCTAssertEqual(received, ["hello"])
  }

  func testEmitsStatusOnConnectDisconnectAndWritableChange() {
    var emits = 0
    let channel = CastMessageChannel(
      namespace: "urn:x-cast:test",
      onMessage: { _ in },
      onStatus: { _, _ in emits += 1 })
    channel.didConnect()
    channel.didDisconnect()
    channel.didChangeWritableState(true)
    // The assertion is the *forwarding*; off-session GCK reports
    // not-connected/not-writable, so values aren't asserted here.
    XCTAssertEqual(emits, 3)
  }
}
```

- [ ] **Step 6: Build + test**

```bash
cd example/ios && pod install && cd ../..   # nitrogen output changed in Task 1
xcodebuild -project example/ios/Pods/Pods.xcodeproj -target NitroGoogleCast \
  -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

Expected: BUILD SUCCEEDED. Run the XCTest target the same way the existing
converter tests run (see `ios.yml` for the exact scheme/destination used in CI).

- [ ] **Step 7: Commit**

```bash
git add ios/ example/ios/NitroGoogleCastTests/CastMessageChannelTests.swift
git commit -m "feat(v5): Phase 5 T2c — iOS custom channels (GCKCastChannel registry) (v5-8me.8)"
git push origin petrbela/p52-ios
```

---

### Task 9: 2d — Android (`Cast.MessageReceivedCallback` registry, bead `v5-8me.9`)

Lane D: `git checkout -b petrbela/p52-android` from the Task 1 barrier commit.

**Files:**
- Modify: `android/src/main/java/com/margelo/nitro/googlecast/HybridCastTransport.kt`

- [ ] **Step 1: State + imports.** Add imports:

```kotlin
import com.google.android.gms.common.api.Status
```

Add fields next to `onMediaStatus`:

```kotlin
  private var onChannelMessage: ((String, String) -> Unit)? = null
  private var onChannelStatus: ((String, Boolean, Boolean) -> Unit)? = null

  // Registered custom channels by namespace (Phase 5.2). Cleared explicitly on
  // session end/suspend and on dispose (A1) so a dead session's callbacks never
  // leak into the next one. Main thread only.
  private val channels = mutableMapOf<String, Cast.MessageReceivedCallback>()

  // In-flight sendMessage results, so dispose can cancel them (mirrors
  // `pendingResults`; sendMessage returns PendingResult<Status>, not
  // MediaChannelResult, hence the separate set).
  private val pendingChannelResults = mutableSetOf<PendingResult<Status>>()
```

- [ ] **Step 2: `initAndSubscribe`** — extend to the generated 6-callback signature (copy exact parameter names from the regenerated `HybridCastTransportSpec.kt`) and store both:

```kotlin
  override fun initAndSubscribe(
    onState: (castState: CastState) -> Unit,
    onDevices: (devices: Array<Device>) -> Unit,
    onLifecycle: (event: SessionLifecycleEvent) -> Unit,
    onMediaStatus: (status: MediaStatus) -> Unit,
    onChannelMessage: (namespace: String, message: String) -> Unit,
    onChannelStatus: (namespace: String, connected: Boolean, writable: Boolean) -> Unit
  ): Promise<InitialSnapshot> {
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    this.onMediaStatus = onMediaStatus
    this.onChannelMessage = onChannelMessage
    this.onChannelStatus = onChannelStatus
    // … (rest of the existing body unchanged)
```

- [ ] **Step 3: The three mutations.** Add after the device volume/mute section:

```kotlin
  // MARK: - custom channels (Phase 5.2 — registry owned here, Invariant 1 for the session)

  override fun addChannel(namespace: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
      if (session == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      if (channels.containsKey(namespace)) {
        promise.reject(
          CastRejection(
            castRejectionJson(
              "alreadyRegistered", "A channel for $namespace is already registered.", null
            )
          )
        )
        return@runOnMain
      }
      val callback = Cast.MessageReceivedCallback { _, ns, message ->
        onChannelMessage?.invoke(ns, message)
      }
      try {
        session.setMessageReceivedCallbacks(namespace, callback)
      } catch (e: Exception) {
        // setMessageReceivedCallbacks throws IOException / IllegalStateException.
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
        return@runOnMain
      }
      channels[namespace] = callback
      // Register-once status (v4 parity, A2): the Android SDK has no
      // per-channel connect/writable callbacks, so {true, true} is emitted
      // exactly once at registration and never updated — emitted BEFORE
      // resolving so an awaiting façade reads a populated value.
      onChannelStatus?.invoke(namespace, true, true)
      promise.resolve(Unit)
    }
    return promise
  }

  override fun removeChannel(namespace: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      if (channels.remove(namespace) != null) {
        // Best-effort: the session may already be gone (its callbacks died
        // with it); unregistering from a live one keeps GCK in sync.
        try {
          sharedCastContextOrNull()?.sessionManager?.currentCastSession
            ?.removeMessageReceivedCallbacks(namespace)
        } catch (_: Exception) {}
      }
      promise.resolve(Unit) // idempotent — not-registered resolves
    }
    return promise
  }

  override fun sendMessage(namespace: String, message: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
      if (session == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      if (!channels.containsKey(namespace)) {
        promise.reject(
          CastRejection(
            castRejectionJson(
              "invalidRequest", "No channel registered for $namespace — call addChannel first.",
              null
            )
          )
        )
        return@runOnMain
      }
      val pending =
        try {
          session.sendMessage(namespace, message)
        } catch (e: Exception) {
          promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
          return@runOnMain
        }
      // A2-minor: await the PendingResult — never fire-and-forget a send.
      pendingChannelResults.add(pending)
      pending.setResultCallback { result ->
        pendingChannelResults.remove(pending)
        val status = result.status
        if (status.isSuccess) {
          promise.resolve(Unit)
        } else {
          promise.reject(
            CastRejection(
              castRejectionJson(
                castErrorCodeFromGckStatusCode(status.statusCode),
                status.statusMessage,
                status.statusCode
              )
            )
          )
        }
      }
    }
    return promise
  }
```

- [ ] **Step 4: Registry lifecycle (A1).** Add the helper next to `detachCastListener()`:

```kotlin
  /**
   * Drop every registered custom channel (A1). Called on session end/suspend
   * (with the callback's still-valid session handle, so the GCK-side
   * unregistration succeeds) and on dispose. The app re-adds channels on the
   * next session, per the guide.
   */
  private fun clearChannels(session: CastSession?) {
    if (channels.isEmpty()) return
    channels.keys.forEach { namespace ->
      try {
        session?.removeMessageReceivedCallbacks(namespace)
      } catch (_: Exception) {}
    }
    channels.clear()
  }
```

Call it in the session listener (both teardown callbacks):

```kotlin
      override fun onSessionEnded(session: CastSession, error: Int) {
        detachMediaCallback()
        detachCastListener()
        clearChannels(session)
        // … existing emit(ENDED, …) unchanged
      }
      override fun onSessionSuspended(session: CastSession, reason: Int) {
        detachMediaCallback()
        detachCastListener()
        clearChannels(session)
        emit(SessionEventType.SUSPENDED, reason = suspendReason(reason))
      }
```

And in `dispose()` next to the existing cancels:

```kotlin
      clearChannels(sharedCastContextOrNull()?.sessionManager?.currentCastSession)
      pendingChannelResults.forEach { it.cancel() }
      pendingChannelResults.clear()
      onChannelMessage = null
      onChannelStatus = null
```

- [ ] **Step 5: Compile + tests**

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
cd example/android
./gradlew :react-native-google-cast:compileDebugKotlin
./gradlew :react-native-google-cast:testDebugUnitTest   # existing Robolectric suite stays green
```

Expected: BUILD SUCCESSFUL on both.

- [ ] **Step 6: Commit**

```bash
git add android/
git commit -m "feat(v5): Phase 5 T2d — Android custom channels (MessageReceivedCallback registry) (v5-8me.9)"
git push origin petrbela/p52-android
```

---

### Task 10: Assemble, review, PR, merge

- [ ] **Step 1: Integration branch** from the Task 1 barrier commit on `v5`:

```bash
git checkout v5 && git checkout -b petrbela/phase5.2
git merge --no-ff origin/petrbela/p52-ts
git merge --no-ff origin/petrbela/p52-ios
git merge --no-ff origin/petrbela/p52-android
```

(Lanes touch disjoint dirs — expect zero conflicts, as in 5.1.)

- [ ] **Step 2: Combined verification**

```bash
yarn typescript && yarn test && npx prettier --check "src/**/*.ts"
# iOS + Android compile checks as in Tasks 8/9
```

- [ ] **Step 3: Two-stage independent review of the native diffs** — dispatch **harness Agent-tool subagents** (NOT Orca TUI agents; their reports return directly):
  - one reviewer for `git diff <barrier>..HEAD -- ios/` (checklist: Invariant 1 per call, A1 clear sites, initial-status-before-resolve, GCKCastChannel override signatures vs headers, retain cycles via `[weak self]`, main-thread discipline),
  - one for `git diff <barrier>..HEAD -- android/` (checklist: Invariant 1, A1 clear sites incl. suspend, register-once status, PendingResult settlement exactly-once, try/catch on GCK throwing APIs, main-thread discipline),
  - then a holistic reviewer over the full diff (drift surfaces aligned, two-flow split respected — messages never in a slice/snapshot, docs match behavior).
  Fix findings; re-run verification.

- [ ] **Step 4: PR into `v5`** (native CI — ios.yml/android.yml — is the authoritative gate):

```bash
git push origin petrbela/phase5.2
gh pr create --base v5 --title "feat(v5): Phase 5 Slice 5.2 — CastChannel (v5-8me.6/.7/.8/.9)" --body "…summary + review notes…"
```

- [ ] **Step 5: Merge (squash — repo disallows merge commits) after CI green + reviews clean. Requires explicit user approval.** Then:

```bash
bd close v5-8me.5 v5-8me.6 v5-8me.7 v5-8me.8 v5-8me.9
```

---

## Failure-mode coverage (from the epic plan — every row must hold after Task 10)

| Codepath | Handling | Covered by |
|----------|----------|------------|
| `sendMessage` after disconnect | `assertActive` → `noSession` reject | channels.test.ts (generation guard) |
| status/message racing teardown | slice live-gate drops; bus liveness-scoped | channel.slice.test.ts + channels.test.ts |
| Android `sendMessage` non-success | await `PendingResult` → typed reject | Task 9 code (device-gated for real receiver) |
| iOS channel not connected at add | real initial status + v4 `console.warn` | channels.test.ts (warn test); device-gated for transitions |
| native registry across sessions | explicit `clearChannels` on end/suspend/dispose (A1) | Tasks 8/9 code + slice-clear jest; device-gated |
| hook remount self-collision | serialized remove→re-add (T1) | useCastChannel.test.ts |

**Device-gated (real Chromecast, post-merge):** real message delivery both platforms, iOS connected/writable transitions, teardown auto-remove.

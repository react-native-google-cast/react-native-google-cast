# CastChannel — design (Phase 5, slice 5.2, epic `v5-8me`)

**Status:** approved design, pre-implementation
**Date:** 2026-07-11
**Beads:** `v5-8me.5` (this design), `v5-8me.6`–`.9` (2a transport / 2b TS / 2c iOS / 2d Android)

## Goal

v4-parity custom channels for the v5 Nitro rewrite: `CastSession.addChannel`,
`CastChannel` (`sendMessage` / `onMessage` / `offMessage` / `remove` +
`connected` / `writable`), namespace-scoped inbound message routing, and a
`useCastChannel` hook — built on the established "thin Nitro bridge + fat
TypeScript + central store" architecture, faithful to what each native SDK
actually exposes.

## Design principles applied

- **Faithful native wrapping.** Expose what the native object exposes; do not
  invent behavior. Where iOS and Android SDKs differ, mirror each honestly and
  document the asymmetry (see `connected`/`writable`).
- **v4 public-API parity.** Keep the v4 surface so migration is mechanical.
- **The two-flow split.** A channel carries two different things: **messages**
  (transient, high-frequency, not state) and **connection status** (replayable
  state). They travel different paths — see Architecture.

## Public API (v4-faithful)

```ts
// on the CastSession façade (slice 5.1)
addChannel(namespace: string, onMessage?: (message: string) => void): Promise<CastChannel>

class CastChannel {
  readonly namespace: string
  // Read synchronously from the store's channel slice.
  get connected(): boolean | undefined
  get writable(): boolean | undefined

  sendMessage(message: object | string): Promise<void> // objects JSON.stringified (v4)
  onMessage(listener: (message: string) => void): void  // single listener, replace-on-set (v4)
  offMessage(): void
  remove(): Promise<void>
}

// hook
function useCastChannel(
  namespace: string,
  onMessage?: (message: string) => void
): CastChannel | null
```

**Validation (v4 parity), enforced in the TS façade before crossing the bridge:**
- Namespace must start with `urn:x-cast:` → otherwise reject.
- `urn:x-cast:com.google.cast.media` is reserved → reject.

**Message representation — string-only bridge.** The Nitro surface carries plain
strings both ways. The façade preserves v4 ergonomics: `sendMessage` accepts
`object | string` and `JSON.stringify`s objects; inbound is delivered as the raw
string GCK produced (the caller `JSON.parse`s if their receiver sends JSON — the
custom-channels guide already documents this). **No envelope struct, no
converter fixture, no parity test** — the bridge marshals only strings.

**Listener semantics — single, replace-on-set (v4).** A channel is a *pipe*, not
a broadcast; unlike `onMediaProgressUpdated` (multi-listener, because progress is
a shared broadcast), `onMessage` replaces any prior listener and `offMessage`
clears it. `useCastChannel` owns the channel's listener, so passing `onMessage`
to the hook **and** calling `channel.onMessage` elsewhere clobbers — identical to
v4, documented in the migration guide.

## Architecture

### The two flows

| Flow | Path | Replayed? | In `getSnapshot`? |
|------|------|-----------|-------------------|
| Inbound **messages** | dedicated namespace-keyed **message bus** | never | no |
| **connected/writable** | `channelStatus` `StoreEvent` → `channel.slice.ts` | via snapshot | yes (slice) |

Messages are *not* state — a late subscriber must not see a replay of past
messages — so they never touch a slice and never enter `getSnapshot`. Connection
status *is* state — a component mounting mid-session must see the current
`connected`/`writable` — so it lives in a slice.

### Transport surface (`CastTransportApi` + `CastTransport.nitro.ts` + fake) — 2a

```ts
addChannel(namespace: string): Promise<void>
removeChannel(namespace: string): Promise<void>
sendMessage(namespace: string, message: string): Promise<void>

// two new push callbacks on initAndSubscribe (mirrors onMediaStatus):
onChannelMessage(namespace: string, message: string): void
onChannelStatus(namespace: string, connected: boolean, writable: boolean): void
```

`addChannel` resolves **after** native has registered the channel *and* emitted
the initial `onChannelStatus` for that namespace — so a façade that `await`s
`addChannel` then reads `channel.connected` sees a populated value (v4 behavior:
v4 awaited native and warned if `!connected`).

All three drift surfaces updated in lockstep + `yarn nitrogen`. **Barrier**: 2b/2c/2d branch from the 2a commit.

### Store (`CastStore.ts`, `slice.ts`, `channel.slice.ts`) — 2b

- **`StoreEvent` gains `channelStatus`** `{ kind: 'channelStatus'; namespace; connected; writable }`. (The plan's reserved "channel messages in P5" note is superseded: **messages are not a `StoreEvent`**; only status is.)
- **`channel.slice.ts`:** `Map<namespace, { connected, writable }>` as a frozen
  record. `seed` → empty. `reduce`:
  - `channelStatus` → set/replace that namespace's entry (ref-stable: same slice
    ref if the values are unchanged, Invariant 2).
  - `SESSION_TEARDOWN_TYPES` → clear all entries (channels auto-removed on
    disconnect, per the guide + v4).
  - `SESSION_ESTABLISH_TYPES` → clear all entries (a new session starts with no
    channels; the app re-adds them).
- **Second bus:** `CastStore` gains a namespace-keyed message bus with
  `onChannelMessage(namespace, handler): () => void` and an internal
  `emitChannelMessage(namespace, message)` fed from the transport's
  `onChannelMessage` callback via a dedicated path that **does not** run the
  slice `dispatch` loop and is **not** the `SessionEventType` lifecycle bus.

### Façade + hook (`CastChannel.ts`, `useCastChannel.ts`) — 2b

- `CastChannel` is **generation-bound** (captures the session generation at
  creation) and calls `assertActive()` before every bridge crossing — a channel
  retained across a disconnect rejects `noSession`, never crashes (Invariant 3).
- `connected`/`writable` read synchronously from `channel.slice`.
- `sendMessage` → `assertActive()` → `transport.sendMessage(namespace, str)`.
- `onMessage` → subscribe to the store message bus filtered to this namespace
  (replace prior); `offMessage` → unsubscribe. The subscription is
  **liveness-scoped** like the 5.1 detail listeners: the handler no-ops (and the
  channel drops it) once this façade is stale, so a channel retained across a
  disconnect can never deliver a *later* session's messages, even if the app
  re-registered the same namespace. (The store bus subscription method and the
  transport's `onChannelMessage` callback share a name but are different layers —
  the transport callback feeds `store.emitChannelMessage`; the façade subscribes
  via the store.)
- `remove` → `assertActive()` → `transport.removeChannel(namespace)`, and drops
  the local listener.
- `CastSession.addChannel(namespace, onMessage?)` (added to the 5.1 façade):
  validates the namespace, `await transport.addChannel`, constructs the
  generation-bound `CastChannel`, wires `onMessage` if given, returns it.
- `useCastChannel(namespace, onMessage?)`: adds the channel on the current
  session, removes it on unmount / session change; re-wires `onMessage` when it
  changes (owns the single listener).

### Native adapters

**iOS (2c)** — a `GCKCastChannel` NSObject subclass per namespace:
- `didReceiveTextMessage(_:)` → `onChannelMessage(namespace, message)`.
- `didConnect` / `didDisconnect` / `didChangeWritableState(_:)` →
  `onChannelStatus(namespace, isConnected, isWritable)` (real dynamic values).
- `add(channel:)` on registration also emits the initial `onChannelStatus`
  before `addChannel` resolves. `add`/`remove` re-resolve `currentCastSession`
  per call (Invariant 1); the transport owns the channel registry, never a
  cached session handle.

**Android (2d)** — `Cast.MessageReceivedCallback`:
- `setMessageReceivedCallbacks(namespace, cb)` / `removeMessageReceivedCallbacks`
  / `sendMessage(namespace, message)`, re-resolving `currentCastSession` per call.
- `onMessageReceived(device, namespace, message)` → `onChannelMessage`.
- **Platform asymmetry (documented):** Android's SDK has no per-channel channel
  object and no connect/writable/disconnect callbacks. On successful
  registration the transport emits `onChannelStatus(namespace, true, true)`
  **once** and never updates it — exactly v4's hardcoded `{connected:true,
  writable:true}`. iOS is dynamic; Android is register-once.

## Error handling

- Namespace validation rejects before the bridge (`urn:x-cast:` prefix, reserved
  media namespace).
- Bridge mutations reject a typed `CastError` (`noSession` when no live session;
  native failures translated by the existing adapter). `sendMessage` on a
  disconnected/unregistered channel rejects rather than crashing.
- Generation guard: any op on a stale channel rejects `noSession`.
- Session teardown clears the channel slice and (implicitly) the native
  registrations; the façade's next op is stale → rejects.

## Testing

**jest (`FakeCastTransport`)** — no device needed:
- namespace validation (prefix + reserved rejection);
- `addChannel` registers + resolves with populated `connected/writable`;
- message bus routes by namespace (a message for ns A never reaches ns B's
  listener; messages are never replayed to a late subscriber);
- `onMessage` replace semantics + `offMessage`;
- `channel.slice` seeds empty, updates on `channelStatus`, clears on teardown
  and on new session; ref-stability (Invariant 2);
- generation guard (stale channel rejects);
- `useCastChannel` add-on-mount / remove-on-unmount / re-wire-on-namespace-change.

**Converter parity:** none — string bridge adds no struct.

**Device-gated** (real Cast device, per `docs/internal/phase3-native-spike-checklist.md`):
- real inbound message delivery both platforms;
- iOS `connected`/`writable` transitions (connect/disconnect/writable-change);
- teardown auto-remove.

## Decomposition (barrier-first, mirrors 5.1)

- **`v5-8me.6` (2a)** — transport surface: `addChannel`/`removeChannel`/`sendMessage`
  + `onChannelMessage`/`onChannelStatus` on `initAndSubscribe`; 3 drift surfaces
  + `yarn nitrogen`; fake records + scriptable emits. **No converter fixture.**
  **Barrier** — 2b/2c/2d branch from it.
- **`v5-8me.7` (2b)** — TS: `channel.slice.ts`, the store message bus + `channelStatus`
  `StoreEvent`, `CastChannel.ts`, `CastSession.addChannel`, `useCastChannel.ts`;
  jest. Migration guide: channels section + listener-ownership + platform note.
- **`v5-8me.8` (2c)** — iOS `GCKCastChannel` subclass + registry.
- **`v5-8me.9` (2d)** — Android `Cast.MessageReceivedCallback` + registry + the
  register-once `onChannelStatus(true,true)`.

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

## Non-goals / deferred

- No message-envelope struct / binary messages (string bridge only).
- No multi-listener `onMessage`.
- Web/Chrome sender support (Phase 8).

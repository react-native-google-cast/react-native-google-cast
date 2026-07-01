# Media-progress ticking — design

**Bead:** `v5-aug.6` — Media-progress throttling: local streamPosition ticking + `onMediaProgressUpdated` + interval arbitration (TS + iOS + Android)
**Phase:** 4 (RemoteMediaClient), under epic `v5-aug`
**Date:** 2026-07-01
**Supersedes:** the duplicated interval-arbitration item from `v5-m3i` (T8, closed) and item (1) of `v5-aug.5`.

## Problem

v5 today exposes `useStreamPosition()` and `useMediaStatus()` as pure **status-push** selectors over the
central store's media slice — they update only when the receiver reports a new `MediaStatus`, so the
position does **not** advance between pushes.

v4 provided a *ticking* position via the **native** GCK progress listener
(`RemoteMediaClient.setProgressUpdateInterval` + a `MEDIA_PROGRESS_UPDATED` native event) surfaced as:

- `useStreamPosition(interval = 1)` → `number | null`
- `client.onMediaProgressUpdated(handler: (progress, duration) => void, interval = 1)` — **single** listener
  (attaching another replaced the previous); the interval was a single global via `setProgressUpdateInterval`.

v5 must reintroduce a ticking position while honouring the v5 architecture: a **TS central state machine +
singleton transport, not stateful native objects**.

## Decisions (locked during brainstorming)

1. **Tick source: TS-derived.** No native timer. Position is derived in pure TS from the last `MediaStatus`
   plus a monotonic clock, resynced on every status push. Fits the v5 architecture, is fully unit-testable,
   and adds zero per-tick bridge crossings.
2. **API: full v4 parity.** Keep both the hook (`useStreamPosition(interval?)`) and the imperative
   `RemoteMediaClient.onMediaProgressUpdated(handler, interval?)`, both backed by one shared ticker.
3. **Arbitration: min-interval, tick-all.** One timer at the smallest requested interval; every subscriber is
   invoked on each tick. React consumers dedupe on the derived number, so over-delivery to slower subscribers
   is harmless.
4. **Live streams (judgment call A): un-clamped.** For live content with no finite duration, the derived
   position is left un-clamped (not clamped to `liveSeekableRange.end`).
5. **Paused behaviour (judgment call B): timer off while paused.** No redundant frozen-value emissions; the
   last value stands and the timer resumes when playback resumes.

## Architecture — one shared TS ticker

A new singleton module `src/state/progressTicker.ts`, beside the store:

- Reads the latest `MediaStatus` and play-state from the `castStore` **media slice**
  (`getSliceState<MediaState>(MEDIA_SLICE_KEY)`), subscribing to the store to observe changes.
- Owns a **single** `setInterval`. The timer is active only while `subscribers > 0 AND playerState === 'playing'`.
- Public surface:
  ```ts
  interface ProgressSubscriberOptions { readonly interval?: number } // seconds, default 1
  type ProgressHandler = (position: number, duration: number) => void
  function subscribeProgress(handler: ProgressHandler, interval?: number): () => void
  ```
- On every `subscribe`/`unsubscribe`: recompute the min interval and restart the timer at the new rate (or
  stop it when the last subscriber leaves).
- On every `MediaStatus` push observed from the store: reset the derivation anchor (see below).
- Accepts an injectable `now: () => number` (default `Date.now`) so tests control time deterministically.

Both public APIs are thin wrappers over `subscribeProgress`; no timing logic is duplicated.

### Why this module and not the media slice
Slices are pure reducers over discrete events; a wall-clock timer is a side-effecting subscription, not a
reduction. Keeping it in a dedicated singleton preserves the slice's purity and testability and mirrors how
the store itself isolates the single long-lived native subscription.

## Derivation math

```
base     = status.streamPosition            // reset on every MediaStatus push
anchor   = now()                            // reset on every MediaStatus push
elapsed  = (now() - anchor) / 1000          // seconds
position = playing ? base + elapsed * playbackRate : base
duration = status.mediaInfo?.streamDuration ?? 0
```

- **Resync** `base` and `anchor` on every status push — continuous correction, so drift never accumulates.
- **Freeze** at `base` when `playerState` is not `playing` (paused / buffering / idle).
- **Clamp** to `[0, duration]` when `duration > 0` (VOD). For live (`duration === 0` / no finite
  `streamDuration`), leave un-clamped (decision 4).
- `playbackRate` scales elapsed time (e.g. 2× advances twice as fast).
- When there is no media (`currentStatus === null`), the derived position is `null` and the timer is idle.

## Public API (full v4 parity)

### Hook
```ts
// src/api/useStreamPosition.ts
function useStreamPosition(interval?: number): number | null // default interval = 1 (second)
```
- Returns `null` when there is no active media; otherwise the ticking position in seconds.
- Implemented with `useState` + `useEffect` over `subscribeProgress`, keyed on `interval` so a changed
  interval re-subscribes. (Deliberately *not* `useSyncExternalStore`: a live, time-derived value has no
  stable `getSnapshot` — the ticker pushes new values on each tick, which the `useState` setter absorbs.)

### Imperative (RemoteMediaClient façade)
```ts
// src/api/RemoteMediaClient.ts
onMediaProgressUpdated(
  handler: (position: number, duration: number) => void,
  interval?: number, // default 1 (second)
): EventSubscription // { remove(): void }
```
- v4 signature preserved. **Difference from v4:** v5 supports **multiple** concurrent listeners via the
  shared ticker (v4 allowed only one). Documented in the migration guide.

## Timer lifecycle & arbitration

- Timer starts when the **first** subscriber is added **and** playback is `playing`.
- Timer stops when the **last** subscriber unsubscribes, when media clears (`currentStatus → null` on
  session/media teardown), or when `playerState` leaves `playing`.
- Play-state transitions are observed via the ticker's store subscription: entering `playing` (re)starts the
  timer if subscribers exist; leaving `playing` stops it.
- Interval arbitration: the active interval is `min(intervals of all current subscribers)`; recomputed on
  every membership change; the timer is restarted at the new rate when it changes.
- On teardown the media slice becomes `null`, the ticker emits nothing further, and both hooks return `null`.

## Testing (pure TS, no native)

Unit tests drive `subscribeProgress` / `CastStore` with a `FakeCastTransport` and an injected `now()`:

- single subscriber: position advances by `interval * playbackRate` per tick while playing;
- two subscribers with different intervals → exactly one timer at the min interval; both handlers invoked;
- unsubscribe recomputes the min interval; last unsubscribe stops the timer;
- resync-on-push: a status push mid-tick corrects the base/anchor (no accumulated drift);
- pause freezes the value and stops the timer; resume restarts it;
- VOD clamp: position never exceeds `duration`; live (`duration === 0`) is un-clamped;
- `playbackRate` scaling (e.g. 2×);
- session/media teardown → position `null`, timer stopped;
- hook: `useStreamPosition(interval)` returns `null` with no media, ticks with media, re-subscribes on
  interval change.

## Scope / non-goals

- **No native changes.** iOS and Android already push `MediaStatus`; the TS-derived approach needs nothing
  more from native. (The bead title mentions "iOS + Android" for completeness — this design records that the
  native side is already sufficient, so no Swift/Kotlin work is required.)
- Not in this bead (remain in `v5-aug.5`): `customData` on non-`loadMedia` mutations; dropped v4 convenience
  methods (`queueInsertAndPlayItem`, `setActiveMediaTracks` alias).
- No hybrid native-interpolation ticking (considered and rejected as YAGNI).

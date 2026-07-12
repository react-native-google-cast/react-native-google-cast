---
id: migrating-v4-to-v5
title: Migrating from v4 to v5
sidebar_label: Migrating v4 → v5
---

> **Status:** v5 is a ground-up rewrite onto the React Native New Architecture
> (Nitro Modules). This page is the running migration log; it is finalized in the
> Phase 7 migration guide. It currently covers the Phase 3 changes (context,
> discovery, sessions).

## Read getters are now synchronous

In v4, the "read" getters returned Promises and crossed the native bridge on
every call. In v5 they are served synchronously from a central in-process state
machine (`CastStore`) that mirrors the native Cast state, so they **return a
value directly**:

| Call                                     | v4                                   | v5                    |
| ---------------------------------------- | ------------------------------------ | --------------------- |
| `CastContext.getCastState()`             | `Promise<CastState \| null>`         | `CastState`           |
| `CastContext.getPlayServicesState()`     | `Promise<PlayServicesState \| null>` | `PlayServicesState`   |
| `DiscoveryManager.getDevices()`          | `Promise<Device[]>`                  | `readonly Device[]`   |
| `DiscoveryManager.isRunning()`           | `Promise<boolean>`                   | `boolean`             |
| `DiscoveryManager.isPassiveScan()`       | `Promise<boolean>`                   | `boolean`             |
| `SessionManager.getCurrentCastSession()` | `Promise<CastSession \| null>`       | `CastSession \| null` |

```diff
- const state = await CastContext.getCastState()
+ const state = CastContext.getCastState()

- const session = await GoogleCast.getSessionManager().getCurrentCastSession()
+ const session = GoogleCast.getSessionManager().getCurrentCastSession()
```

`await`-ing a non-Promise still works (it resolves immediately), so the common
`await` form keeps compiling. What changes:

- **`.then()` chains break.** `getCastState().then(...)` is now `.then` on a
  plain value — replace with a direct read.
- **Throw vs. reject.** A read can no longer reject; there is nothing to
  `try/catch` around these getters.
- **Microtask timing.** Reads resolve in the same tick. Code that relied on a
  getter deferring to a later microtask must not.

The method **names are preserved** — it is still `getCurrentCastSession()` (not
`getCurrentSession()`).

## Mutations reject a typed `CastError`

Session mutations are still async and now reject a structured
[`CastError`](../../api/types) (`{ code, message?, nativeCode? }`) instead of an
opaque string:

```diff
  try {
    await GoogleCast.getSessionManager().startSession(deviceId)
  } catch (e) {
-   console.warn(e) // string
+   if (e.code === 'noSession') { /* typed, switchable */ }
  }
```

## Calling a method on an ended session no longer crashes

A `CastSession` returned by `getCurrentCastSession()` (or handed to a
`SessionManager.onSession*` listener) is bound to the session that was live when
you obtained it. Once that session ends, the handle is **stale**: calling a
session operation on it throws/rejects `CastError` `noSession` _before_ anything
crosses the native bridge, instead of crashing on a freed native object. Re-read
`getCurrentCastSession()` to get the current session.

## `CastSession` device detail is now synchronous

`getVolume()`, `isMute()`, `getApplicationMetadata()`, `getApplicationStatus()`,
`getStandbyState()`, and `getActiveInputState()` **return their value directly**
instead of a `Promise` — they read the pushed session state from the store cache
rather than crossing the bridge. Drop the `await`:

```diff
- const volume = await castSession.getVolume()
+ const volume = castSession.getVolume()
```

`setVolume()` / `setMute()` still return a `Promise` (they mutate the device),
and — unlike v4, where `setVolume`/`setMute` did not resolve — they now settle
when the request completes. They control the **device** volume/mute; for the
media stream use `castSession.getClient()` →
`setStreamVolume()` / `setStreamMuted()`. `onStandbyStateChanged` /
`onActiveInputStateChanged` are unchanged from v4. `getClient()` now returns
`null` when there is no live session (consistent with `useRemoteMediaClient`),
so guard the result (`getClient()?.play()`).

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
  updates — exactly v4's hardcoded values. As in v4, the getters are
  point-in-time reads: rendering `channel.connected` in a component does not
  re-render when the status changes.
- **Stale channels reject instead of crashing.** Like `CastSession`, a
  `CastChannel` retained across a disconnect rejects `noSession` on
  `sendMessage` / `remove` (channels are auto-removed with their session), and
  its retained listener can never receive a later session's messages.

## Deferred to later phases

- `CastContext.showCastDialog()` / `showExpandedControls()` /
  `showIntroductoryOverlay()` / `showPlayServicesErrorDialog()` — **Phase 6**
  (they depend on the `CastButton` / cast activity).
- Web / Chrome sender support — **Phase 8**.

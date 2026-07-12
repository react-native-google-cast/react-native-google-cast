---
id: migrating-v4-to-v5
title: Migrating from v4 to v5
sidebar_label: Migrating v4 → v5
---

> **Status:** v5 is a ground-up rewrite onto the React Native New Architecture
> (Nitro Modules). This page is the running migration log; it is finalized in the
> Phase 7 migration guide. It currently covers the Phase 3–6.1 changes (context,
> discovery, sessions, media, channels, Cast UI + hooks).

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

## Cast UI: `CastButton` and the `show*` methods

`CastButton`, `CastContext.showCastDialog()`, `showExpandedControls()` and
`showIntroductoryOverlay()` keep their v4 shape, with these changes:

- **`CastButton` tint is a prop.** v4 read `style.tintColor`; v5 has a
  dedicated `tintColor` prop (any `ColorValue`):

  ```diff
  - <CastButton style={{ width: 24, height: 24, tintColor: 'black' }} />
  + <CastButton tintColor="black" style={{ width: 24, height: 24 }} />
  ```

- **The `show*` booleans mean "the present/launch call was issued."** iOS's
  present APIs are void and Android cannot observe the launched activity, so
  `true` does not guarantee what the presented UI did next. Only
  `showIntroductoryOverlay` verifies actual presentation. Graceful can't-show
  cases resolve `false`; genuine native failures reject a typed `CastError`.
- **`showCastDialog` no longer needs a mounted `CastButton`.** v4 Android
  worked by `performClick()` on a rendered button and resolved `false` without
  one; v5 presents the MediaRouter chooser/controller dialog directly (an
  in-session controller dialog when a session exists, the device chooser
  otherwise). It resolves `false` when the dialog cannot be presented — no
  current Activity, the Cast framework unavailable, or no route selector.
- **`showIntroductoryOverlay` resolves `false` instead of hanging.** v4's
  Android promise never settled when no `CastButton` was on screen, and — via
  the SDK's `setSingleTime()` — when the overlay had already been shown once.
  v5 resolves `false` in both cases (every path settles). A mounted, *visible*
  `CastButton` is still required as the overlay's anchor on both platforms.
- **The overlay's "shown once" flags are platform-local.** iOS uses the Cast
  SDK's flag (cleared when you pass `{ once: false }`); Android uses this
  library's own preference. The two stores are independent — resetting one
  platform does not reset the other.
- **`showExpandedControls` on Android requires a manifest entry.** Register
  `com.margelo.nitro.googlecast.NitroExpandedControllerActivity` (see the
  [ExpandedController](../../components/ExpandedController) doc); a missing
  registration rejects `notSupported` instead of failing silently. Automatic
  wiring (Expo plugin) comes later in v5.

## Hooks: `useCastState` / `useDevices` / `useCastSession` / `useCastDevice`

All four keep their v4 signatures. Behavioral notes:

- **`useCastState` returns `CastState`, never `null`.** v4 returned `null`
  before its async init; v5's store seeds synchronously, so during the brief
  native-init window v5 reports `noDevicesAvailable` where v4 reported `null`.
- **`useCastSession({ ignoreSessionUpdatesInBackground: true })` is
  best-effort in v5.** The option still suppresses the `null` render while the
  session is suspended, but the retained object is **inert during the
  suspension** — calling methods on it rejects `noSession` (materially the
  same as v4, whose retained object also failed natively while suspended).
- **On resume, `useCastSession` hands out a fresh object reference** for the
  same session (v4 kept the old object). Key effects on `castSession?.id` —
  stable across a suspend/resume of the same session — not on the object
  identity.
- **`useCastDevice(options?)`** keeps its v4 parameter and delegates to
  `useCastSession`, so the option keeps the device visible across a
  suspension.

## Deferred to later phases

- `CastContext.showPlayServicesErrorDialog()`, cast options / OptionsProvider
  configuration, notifications & lock-screen controls, expanded-controller
  customization, and the Expo config plugin — **Phase 6.2**.
- Web / Chrome sender support — **Phase 8**.

---
id: web
title: Web support
sidebar_label: Web
---

Since v5, the library runs in the browser (react-native-web) on top of the
[Google Cast Web Sender SDK](https://developers.google.com/cast/docs/web_sender)
(`chrome.cast` + `cast.framework`). The same TypeScript API — `CastContext`,
`SessionManager`, `RemoteMediaClient`, `CastChannel`, and all hooks — works
unchanged; the bundler resolves the web transport via the `.web.ts` extension.

> Casting from the browser is only supported in Chromium-based browsers
> (Chrome, Edge, Opera) — the Cast extension surface does not exist in Firefox
> or Safari. In unsupported browsers the library degrades gracefully:
> `getCastState()` stays `noDevicesAvailable` and mutations reject with
> `notSupported`.

## Setup

Add the Web Sender loader to your page (e.g. `index.html` / `public/index.html`),
per [Google's integration guide](https://developers.google.com/cast/docs/web_sender/integrate):

```html
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

That's it for the Default Media Receiver. The library completes the SDK's
`__onGCastApiAvailable` handshake itself (an existing handler you installed is
chained, not replaced) and calls `CastContext.setOptions` with the
[Default Media Receiver](https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.DEFAULT_MEDIA_RECEIVER_APP_ID)
and the `ORIGIN_SCOPED` auto-join policy.

### Custom receiver / options

To use a custom receiver app id (the web analog of the config plugin's
`receiverAppId`), set the options global **before** the loader script runs:

```html
<script>
  window.__RNGoogleCastOptions = {
    receiverAppId: 'ABCD1234',
    // optional — defaults shown:
    // autoJoinPolicy: 'origin_scoped',
    // resumeSavedSession: true,
    // language: undefined,
    // androidReceiverCompatible: undefined,
  }
</script>
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

The library translates these into
[`cast.framework.CastOptions`](https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastOptions):
`receiverAppId` becomes `receiverApplicationId` (keeping the config plugin's
naming from native), with the Default Media Receiver id filled in when
omitted; `autoJoinPolicy` defaults to `'origin_scoped'` when omitted; and
`language`, `resumeSavedSession`, and `androidReceiverCompatible` pass
through under the same names only when set (otherwise the SDK's own defaults
apply). Do **not** call
`cast.framework.CastContext.getInstance().setOptions()` yourself — the
library owns that call.

## Starting a session

The web sender **does not expose a device list** — the browser owns discovery
and the device picker. Open the picker with:

```ts
import GoogleCast from 'react-native-google-cast'

await GoogleCast.showCastDialog()
```

The user picks a device there;
[`CastContext.requestSession()`](https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastContext#requestSession)
is what runs underneath. Session lifecycle events, media status, volume, and
custom channels then stream through the same hooks and listeners as on native.

The built-in `<CastButton>` renders `null` on web for now — call
`showCastDialog()` from your own button, or render the SDK's
`<google-cast-launcher>` element yourself.

## What works on web

| API surface                                                                       | Web                                                                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `useCastState` / cast state stream                                                | ✅ (maps 1:1 to `cast.framework.CastState`)                                                                     |
| Session lifecycle (`starting`/`started`/`startFailed`/`ending`/`ended`/`resumed`) | ✅                                                                                                              |
| `suspended` / `resuming` / `resumeFailed` events                                  | ❌ never emitted (no equivalent in the web sender)                                                              |
| `useDevices` / `DiscoveryManager`                                                 | ⚠️ device list is always empty; discovery controls are no-ops                                                   |
| `SessionManager.startSession(deviceId)`                                           | ⚠️ web ignores `deviceId` — the browser owns the picker, which opens instead (dev-only `console.warn` flags it) |
| `showCastDialog()`                                                                | ✅ browser Cast picker                                                                                          |
| `showExpandedControls()` / `showIntroductoryOverlay()`                            | ❌ resolves `false` (no such UI in the web SDK)                                                                 |
| `showPlayServicesErrorDialog()`                                                   | ❌ resolves `false` (Android-only)                                                                              |
| `CastSession` volume / mute / app metadata / status / active input                | ✅                                                                                                              |
| Standby state                                                                     | ❌ always `unknown` (no CEC surface on web)                                                                     |
| `loadMedia` (single item + `queueData`), play/pause/stop/seek, stream volume/mute | ✅                                                                                                              |
| Media status stream incl. null-clear on unload                                    | ✅ (`Media.addUpdateListener`)                                                                                  |
| `MediaStatus.videoInfo`                                                           | ❌ not reported by the web sender                                                                               |
| `setPlaybackRate()`                                                               | ❌ `notSupported` — set `MediaLoadRequest.playbackRate` at load                                                 |
| Tracks (`setActiveTrackIds`, `setTextTrackStyle`)                                 | ✅                                                                                                              |
| Queueing (load, insert, reorder, remove, jump, next/prev, repeat mode)            | ✅ (`queueRemoveItems` removes sequentially, not atomically)                                                    |
| `queueInsertAndPlayItem()`                                                        | ❌ `notSupported` — no atomic insert-and-play request                                                           |
| Custom channels (`useCastChannel`, `sendMessage`, inbound messages)               | ✅ (channel status reports `{connected: true}` once, like Android)                                              |
| `customData` on `queueNext`/`queuePrev`/`queueJumpToItem`/`queueSetRepeatMode`    | ⚠️ ignored (the web SDK's queue commands take no custom data)                                                   |

## SSR / Next.js

Server-side rendering is **not yet supported** — the store's hooks call
`useSyncExternalStore` without a server snapshot, so pages using the hooks
must render client-side only (dynamic import with `ssr: false`, or a client
component boundary). Full SSR support is tracked separately. Importing the
library on the server does not crash: the transport only touches the SDK
globals lazily.

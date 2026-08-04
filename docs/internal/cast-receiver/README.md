# Probe receiver — setup (bead v5-8hq.6, T1)

`receiver.html` is a minimal CAF custom receiver for the Phase 6 device pass. The
Default Media Receiver **cannot** serve the `CastChannel` rows — a custom
namespace needs a receiver that answers on it — so this is a hard prerequisite
for Session 2, not a nice-to-have. `addChannel`, `useCastChannel`, and
`useChannelStatus` all ship in 5.0.0-beta; today nothing has exercised them
against a real receiver.

Treat it as permanent test infrastructure: every future channel change, and the
tier-2 flows, get a receiver whose behaviour we control.

## Hosting — automated

`.github/workflows/cast-receiver.yml` publishes this file to GitHub Pages on
every push to `v5` that touches it. The receiver URL is:

```
https://react-native-google-cast.github.io/react-native-google-cast/cast-receiver/
```

`receiver.html` is copied to `cast-receiver/index.html` during the build, so the
URL is a bare directory — easier to paste into the console than one ending in
`.html`. GitHub Pages serves it over HTTPS with a valid certificate, which is
what Cast requires of a **published** receiver. (Google's
[registration docs](https://developers.google.com/cast/docs/registration) allow
plain HTTP while an app is unpublished, but there is no reason to use it here.)

**One-time manual step, and it needs repo-admin rights:** Settings → Pages →
Build and deployment → Source → **GitHub Actions**. Until that is set the
workflow fails at the deploy step with `Get Pages site failed`. This does not
disturb the documentation site — that lives in the separate
`react-native-google-cast.github.io` repository and is served from the org root.

## Registering the app id

The app id **`EA48D3FC`** already exists (it was the v4 playground's). Reuse it
rather than registering a second one — one id, one receiver, one thing to keep
in sync. In the [Cast SDK Developer Console](https://cast.google.com/publish):

1. Edit `EA48D3FC` and set its **Receiver Application URL** to the Pages URL
   above.
2. Under **Cast Receiver Devices**, confirm the Chromecast used for the pass is
   registered by serial number and reads _Ready for Testing_. An unregistered
   device cannot launch an unpublished receiver.

Registration propagates in ~15 minutes; reboot the Chromecast if it still
refuses to launch after that.

### Sender details — leave them alone for now

The console's **Sender Details** (Android package, iOS iTunes ID / bundle ID /
launch URI, web site URL) are a **publishing** requirement. Unpublished testing
is gated on device registration, not on the sender's identity, so blank iOS and
web entries will not block any row in this pass.

The Android entry already reads `com.reactnative.googlecast.playground`. Rather
than editing the console to match the current app id (`com.castexample`), the
plan is the reverse: the `example/` → `playground/` rename (bead `v5-57x`) moves
the app to `com.reactnative.googlecast.playground` on Android and the same
string as the iOS bundle id, so the shipped app matches what is already
registered. Do that rename first and the console needs no edit at all.

Leave iOS blank until there is something to fill it with — the console wants an
iTunes ID, and a debug playground that will never reach the App Store does not
have one.

## Pointing the example app at it

The app id is per-platform config, not something the library reads at runtime.

| Platform | Where                                                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| iOS      | `example/ios/CastExample/AppDelegate.swift` — swap `kGCKDefaultMediaReceiverApplicationID` for `EA48D3FC` in the `GCKDiscoveryCriteria`                                                          |
| Android  | `example/android/app/src/main/AndroidManifest.xml` — the `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` meta-data read by `NitroCastOptionsProvider` (currently `CC1AD845` → `EA48D3FC`) |
| Web      | `window.__RNGoogleCastOptions = { receiverAppId: 'EA48D3FC' }` before the sender loader (see `docs/getting-started/web.md`)                                                                      |

### Which app gets which receiver

| App                            | Receiver                 | Why                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **playground** (this harness)  | `EA48D3FC` custom        | Needs a custom namespace for the channel rows, and gets the media oracle below for free.                                                                                                                                                  |
| **example** (CastVideos-style) | `CC1AD845` Default Media | **Must stay on the DMR.** A custom receiver only launches on Chromecasts registered _in the owning console account_, so an example pointed at `EA48D3FC` would fail for every reader who copies it. The DMR needs no registration at all. |

That split is the whole reason for having two apps, and it is worth stating in
the Phase 7 docs too: "use the Default Media Receiver unless you need a custom
namespace" is the advice for consumers, and the example should model it.

⚠️ **Switching the app id switches every row**, not just the channel ones —
`EA48D3FC` replaces the Default Media Receiver, so the media and queue rows then
run against this receiver too. That is fine (it leaves the CAF `PlayerManager`
untouched) and is arguably a better test, but re-run G3 after the switch rather
than assuming the earlier DMR results carry over. In particular, G4's "the DMR
reports `idle`, never a null `mediaStatus`" finding is a statement about the
**DMR** — a custom receiver may behave differently, and if this one ever does
report null, that is the first real-hardware exercise of the v5-82w null-clear
path.

`PROBE_NAMESPACE` in `example/probeFixtures.ts` must match `NAMESPACE` in
`receiver.html`. Both are
`urn:x-cast:com.reactnative.googlecast.probe` — change them together or not at
all.

## What the rows check

| Row                               | Expected                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Channel registers                 | The probe panel shows `channel=registered`, `status connected=…`                                                                                                                                                   |
| **Registration handshake (#614)** | A `{"type":"hello"}` line appears in the event log **without any send** — the receiver posts it on `SENDER_CONNECTED`, while `addChannel` is still in flight. This is the row the default receiver cannot produce. |
| Echo round trip                   | "Send ping" → `channel → ping sent`, then `channel ← {"type":"echo",…}`                                                                                                                                            |
| Session-scoped teardown           | End the session; the channel handle goes stale and `sendMessage` rejects `noSession`                                                                                                                               |

## The oracle — asserting on the wire payload, with no debugger

The receiver also reports back what arrived on the **reserved media namespace**,
which is the thing that turns "the TV played something, so presumably we sent
the right bytes" into an actual assertion.

`urn:x-cast:com.google.cast.media` cannot be observed with
`addCustomMessageListener` — Google reserves it. The documented way in is
[`PlayerManager.setMessageInterceptor`](https://developers.google.com/cast/docs/web_receiver/core_features),
which sees `LOAD` / `PLAY` / `PAUSE` / `SEEK` / `STOP` / `SET_VOLUME` /
`QUEUE_*` ([message shapes](https://developers.google.com/cast/docs/media/messages)).
The receiver relays each one straight back over our own namespace:

```json
{ "type": "observed", "message": "LOAD", "request": "{…}", "at": 1754… }
```

`request` is a **string** on purpose — one predictable field to substring-match
on (Maestro can assert against it) and safely clear of the 64 KB
custom-message limit.

**No `chrome://inspect` needed.** The debugger and the Cast Debug Logger are for
a human reading logs on a second screen; an oracle wants the data back _in band_,
where the test runner already is. That is the whole trick — and it is why this
costs one interceptor loop rather than a debugging setup.

Why it is worth having: both converter bugs found on 2026-08-02 — `contentId`
not defaulting to `contentUrl`, and `streamType` left unset — were invisible
exactly because **media played anyway**. Only a side-by-side against the v4
playground caught them. With the oracle in place they would have shown up in the
event log on the first load.

Every interceptor returns its request unmodified, so playback is untouched; a
relay failure is caught and logged rather than propagated (a throw inside a
`LOAD` interceptor would break playback, and returning `null` would reject the
command outright).

The receiver logs every message it sees on-screen, so a failure can be localised
to the sender or the receiver without guessing. `chrome://inspect` against the
Chromecast (same network, device registered for debugging) gives the full
console.

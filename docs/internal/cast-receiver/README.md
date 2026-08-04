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

Edit `EA48D3FC` and set its **Receiver Application URL** to the Pages URL above.

**`EA48D3FC` is published**, which removes the usual friction: no
`Cast Receiver Devices` entry, no serial numbers, no _Ready for Testing_ state,
no waiting for registration to propagate. Any Chromecast can launch it, so any
contributor can run the channel rows without a Cast console account of their
own. (Device registration is only needed for _unpublished_ receivers — if you
ever fork this to a private app id, that step comes back.)

Two consequences of being published, both already satisfied here:

- The receiver URL **must** be HTTPS
  ([registration docs](https://developers.google.com/cast/docs/registration) —
  plain HTTP is only tolerated while unpublished). GitHub Pages provides it.
- A URL change on a published app may take a while to reach devices. If the
  Chromecast still loads the old receiver, give it a few minutes and reboot it
  before suspecting the deploy — the Pages URL itself can be checked
  independently in any browser.

### Sender details — leave them alone for now

The console's **Sender Details** (Android package, iOS iTunes ID / bundle ID /
launch URI, web site URL) are a **publishing** requirement. Unpublished testing
is gated on device registration, not on the sender's identity, so blank iOS and
web entries will not block any row in this pass.

The Android entry already reads `com.reactnative.googlecast.playground`. Rather
than editing the console to match the old app id (`com.castexample`), the
`example/` → `playground/` rename (bead `v5-57x`) went the other way: the app is
now `com.reactnative.googlecast.playground` on Android **and** the same string as
the iOS bundle id, so the shipped app matches what is already registered and the
console needs no edit at all.

Leave iOS blank until there is something to fill it with — the console wants an
iTunes ID, and a debug playground that will never reach the App Store does not
have one.

## Where the app id lives

It is per-platform config, not something the library reads at runtime. The
playground is **already pointed at `EA48D3FC`** on both native platforms; this
table is where to look when that needs changing.

| Platform | Where                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `playground/ios/CastPlayground/AppDelegate.swift` — the `GCKDiscoveryCriteria` application id                                                                      |
| Android  | `playground/android/app/src/main/AndroidManifest.xml` — the `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` meta-data read by `NitroCastOptionsProvider` |
| Web      | `window.__RNGoogleCastOptions = { receiverAppId: 'EA48D3FC' }` before the sender loader (see `docs/getting-started/web.md`)                                     |

### Which app gets which receiver

| App                            | Receiver                 | Why                                                                                                                                    |
| ------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **playground** (this harness)  | `EA48D3FC` custom        | Needs a custom namespace for the channel rows, and gets the media oracle below for free.                                               |
| **example** (CastVideos-style) | `CC1AD845` Default Media | Models the zero-config path a consumer actually starts from, and avoids baking a project-owned app id into code readers copy verbatim. |

Since `EA48D3FC` is **published**, the example _could_ technically use it — this
is a choice, not a constraint. Two reasons not to:

- A reader who copies the example inherits **our** app id. It would work, which
  is the problem: nothing fails, and they can ship pointed at a receiver they do
  not own. The Default Media Receiver has no such trap.
- The example exists to demonstrate the default path. `docs/getting-started`
  tells consumers to use the DMR unless they need a custom namespace; the
  example should model exactly that.

So the split stands, but for API-design reasons rather than because a custom
receiver would fail to launch.

⚠️ **The app id switch switched every row**, not just the channel ones —
`EA48D3FC` replaces the Default Media Receiver, so the media and queue rows now
run against this receiver too. That is fine (it leaves the CAF `PlayerManager`
untouched) and is arguably a better test, but **G3 and G4 must be re-run** —
the earlier DMR results do not carry over. In particular, G4's "the DMR reports
`idle`, never a null `mediaStatus`" finding is a statement about the **DMR**; a
custom receiver may behave differently, and if this one ever does report null,
that is the first real-hardware exercise of the v5-82w null-clear path.

`PROBE_NAMESPACE` in `playground/probeFixtures.ts` must match `NAMESPACE` in
`receiver.html`. Both are
`urn:x-cast:com.reactnative.googlecast.probe` — change them together or not at
all. `CHANNEL_PROBE_ENABLED` in the same file is coupled to the app id for the
same reason: registering a namespace the receiver does not declare tears the
session down (see the constant's own doc comment).

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

# Probe receiver — setup (bead v5-8hq.6, T1)

`receiver.html` is a minimal CAF custom receiver for the Phase 6 device pass. The
Default Media Receiver **cannot** serve the `CastChannel` rows — a custom
namespace needs a receiver that answers on it — so this is a hard prerequisite
for Session 2, not a nice-to-have. `addChannel`, `useCastChannel`, and
`useChannelStatus` all ship in 5.0.0-beta; today nothing has exercised them
against a real receiver.

Treat it as permanent test infrastructure: every future channel change, and the
tier-2 flows, get a receiver whose behaviour we control.

## Two manual steps (nobody can automate these)

### 1. Host the page over HTTPS

Cast receivers must be served over TLS with a valid certificate. Any static host
works — GitHub Pages, Firebase Hosting, Netlify, an S3 bucket behind CloudFront.
Note the final URL, e.g. `https://<you>.github.io/rngc-probe-receiver/`.

### 2. Register the app id

In the [Cast SDK Developer Console](https://cast.google.com/publish):

1. **Add new application → Custom Receiver**, pointing at the URL from step 1.
2. Copy the **Application ID** (8 hex characters, e.g. `A1B2C3D4`).
3. Under **Cast Receiver Devices**, register the serial number of the Chromecast
   used for the pass. An unregistered device cannot launch an unpublished
   receiver.

Registration propagates to the device in ~15 minutes; reboot the Chromecast if
it still refuses to launch after that.

## Pointing the example app at it

The app id is per-platform config, not something the library reads at runtime.

| Platform | Where                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| iOS      | `example/ios/CastExample/AppDelegate.swift` — swap `kGCKDefaultMediaReceiverApplicationID` for your id in the `GCKDiscoveryCriteria` |
| Android  | `example/android/app/src/main/AndroidManifest.xml` — the `com.margelo.nitro.googlecast.RECEIVER_APPLICATION_ID` meta-data read by `NitroCastOptionsProvider` (currently `CC1AD845`) |
| Web      | `window.__RNGoogleCastOptions = { receiverAppId: '…' }` before the sender loader (see `docs/getting-started/web.md`) |

`PROBE_NAMESPACE` in `example/probeFixtures.ts` must match `NAMESPACE` in
`receiver.html`. Both are
`urn:x-cast:com.reactnative.googlecast.probe` — change them together or not at
all.

## What the rows check

| Row                       | Expected                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Channel registers         | The probe panel shows `channel=registered`, `status connected=…`                                                                       |
| **Registration handshake (#614)** | A `{"type":"hello"}` line appears in the event log **without any send** — the receiver posts it on `SENDER_CONNECTED`, while `addChannel` is still in flight. This is the row the default receiver cannot produce. |
| Echo round trip           | "Send ping" → `channel → ping sent`, then `channel ← {"type":"echo",…}`                                                                |
| Session-scoped teardown   | End the session; the channel handle goes stale and `sendMessage` rejects `noSession`                                                    |

The receiver logs every message it sees on-screen, so a failure can be localised
to the sender or the receiver without guessing. `chrome://inspect` against the
Chromecast (same network, device registered for debugging) gives the full
console.

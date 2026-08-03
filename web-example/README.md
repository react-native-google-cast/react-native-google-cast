# Web harness (bead T9)

A minimal Vite + react-native-web app that runs the v5 library **in a real
browser**. #629 shipped ~1100 lines of web transport and #632 the
`<google-cast-launcher>` CastButton; between them they had never executed
outside jest, against `src/transport/__fakes__/fakeWebCastSdk.ts`, while
`docs/getting-started/web.md` already documented the setup. This closes rows
W1–W7 of [`../docs/internal/phase6-device-pass-checklist.md`](../docs/internal/phase6-device-pass-checklist.md).

**This gates the 5.0.0-beta tag**, not bead v5-8hq.6.

```bash
yarn                       # repo root
yarn workspace web-example dev
# → http://localhost:5173
```

The harness consumes the library **from `src/`**, not from `lib/` — it is here
to test what is on the branch, not the last build output. The `.web.*` resolve
extensions in `vite.config.ts` are the mechanism that swaps in the web transport
and the launcher CastButton; if you reorder them, you are no longer testing the
web build.

`index.html` carries the Cast Web Sender loader exactly as the docs prescribe,
plus a commented-out `window.__RNGoogleCastOptions` block for pointing the
harness at a custom receiver.

## Status of the W rows

Verified in Chrome with **no Cast device on the network**:

| Row | Status | Notes |
| --- | ------ | ----- |
| W1 — harness builds, SDK loads | ✅ | `vite build` clean; `SDK: ready`, `cast.framework` and `chrome.cast.isAvailable` both true; the library's own `__onGCastApiAvailable` handshake completes and `useCastState` reports a real `noDevicesAvailable`. Zero console errors or warnings on load. |
| W2 — launcher renders | ✅ (as far as is possible without a device) | `<google-cast-launcher>` is created, the custom element is defined, our wrapper measures 32×32, and `tintColor` lands as `--connected-color` / `--disconnected-color`. CAF then sets `display: none` on the element itself — **that is CAF hiding the launcher because no devices are available, not a bug**; our code sets `display: block` and CAF overrides it. Re-confirm it becomes visible with a Chromecast present. |
| W3 — picker → connect | ⛔ needs a Chromecast on the same network |
| W4 — `loadMedia` plays | ⛔ needs a Chromecast |
| W5 — status streams | ⛔ needs a Chromecast |
| W6 — disconnect | ⛔ needs a Chromecast |
| W7 — non-Chromium degradation | ⛔ manual — needs Firefox/Safari; not reachable through Chrome automation |

Also observed, and matching the documented web behaviour table:

- `showExpandedControls()` → `false` (no such UI in the web SDK).
- `useDevices()` → `0` always; the browser owns discovery and the picker.
- `useRemoteMediaClient()` → `null` with no session, so the media probes report
  `SKIPPED` rather than throwing.

## Finishing W3–W6

Put a Chromecast on the same network as this machine, reload, and:

1. The launcher becomes visible; `useCastState` moves to `notConnected`.
2. Click it (or "showCastDialog") → Chrome's picker → choose the device.
3. "Load" → Big Buck Bunny plays; `useMediaStatus` fills in with a
   `streamDuration` near 596.
4. Play / Pause / Seek / Vol / Stop each land on the TV.
5. "End session" → `ending` → `ended` in the log, status back to null.

Record the results in the W table of the device-pass checklist.

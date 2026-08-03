/**
 * Browser harness for the v5 web transport (bead T9).
 *
 * #629 shipped ~1100 lines of web transport and #632 a `<google-cast-launcher>`
 * CastButton; between them they had never run in a browser — only under jest
 * against `src/transport/__fakes__/fakeWebCastSdk.ts` — while
 * `docs/getting-started/web.md` already documented the setup. This closes rows
 * W1–W7 of `docs/internal/phase6-device-pass-checklist.md`.
 *
 * Deliberately the same shape as the native probe harness: an event log plus
 * crude one-button-per-API probes, so a failed row has one suspect.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import GoogleCast, {
  CastButton,
  useCastState,
  useDevices,
  useCastSession,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
  type CastError,
} from 'react-native-google-cast'

// Kept in step with example/probeFixtures.ts — Google's gtv-videos-bucket
// sample assets (BigBuckBunny.mp4 et al) now 403, and a dead fixture surfaces
// as a RESOLVED loadMedia followed by idleReason: error, which reads like a
// wrapper bug and is not one.
const FIXTURE = {
  contentUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  contentType: 'video/mp4',
  expectedDuration: 52.2,
  title: 'Sintel (trailer)',
}

/** Whether the Cast Web Sender SDK has announced itself (W1). */
function useSdkPresence(): 'loading' | 'ready' | 'unsupported' {
  const [state, setState] = useState<'loading' | 'ready' | 'unsupported'>(
    'loading'
  )
  useEffect(() => {
    let cancelled = false
    const check = () =>
      typeof (globalThis as { cast?: { framework?: unknown } }).cast
        ?.framework !== 'undefined'
    if (check()) {
      setState('ready')
      return
    }
    // The loader never resolves in a non-Chromium browser (W7) — after a
    // bounded wait, report that rather than spinning forever.
    const timer = setInterval(() => {
      if (cancelled) return
      if (check()) {
        setState('ready')
        clearInterval(timer)
      }
    }, 250)
    const giveUp = setTimeout(() => {
      if (!cancelled && !check()) setState('unsupported')
      clearInterval(timer)
    }, 8000)
    return () => {
      cancelled = true
      clearInterval(timer)
      clearTimeout(giveUp)
    }
  }, [])
  return state
}

export function App() {
  const sdk = useSdkPresence()
  const castState = useCastState()
  const devices = useDevices()
  const session = useCastSession()
  const client = useRemoteMediaClient()
  const status = useMediaStatus()
  const position = useStreamPosition()

  const seq = useRef(0)
  const [log, setLog] = useState<string[]>([])
  const append = useCallback((line: string) => {
    const entry = `${++seq.current} · ${line}`
    console.log(`[WEB] ${entry}`)
    setLog((prev) => [entry, ...prev].slice(0, 80))
  }, [])

  useEffect(() => {
    const sm = GoogleCast.getSessionManager()
    const subs = [
      GoogleCast.onCastStateChanged((s) => append(`castState → ${s}`)),
      sm.onSessionStarting((s) => append(`starting (${s?.id ?? '—'})`)),
      sm.onSessionStarted((s) => append(`started (${s?.id ?? '—'})`)),
      sm.onSessionStartFailed((_s, e) =>
        append(`startFailed: ${e?.code} / native ${e?.nativeCode}`)
      ),
      sm.onSessionEnding((s) => append(`ending (${s?.id ?? '—'})`)),
      sm.onSessionEnded((_s, e) =>
        append(`ended${e ? `: ${e.code} / native ${e.nativeCode}` : ''}`)
      ),
      sm.onSessionResumed((s) => append(`resumed (${s?.id ?? '—'})`)),
    ]
    append(
      `init seed: castState=${GoogleCast.getCastState()} devices=${
        GoogleCast.getDiscoveryManager().getDevices().length
      }`
    )
    return () => subs.forEach((s) => s.remove())
  }, [append])

  const run = (label: string, fn: () => Promise<unknown>) =>
    fn().then(
      (v) => append(`${label} → ${JSON.stringify(v) ?? 'resolved'}`),
      (e: CastError) => append(`${label} rejected: ${e.code} — ${e.message}`)
    )

  const media = (label: string, fn: () => Promise<unknown>) => {
    if (!client) {
      append(`${label} SKIPPED — no client (connect first)`)
      return
    }
    void run(label, fn)
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <h1 style={S.h1}>react-native-google-cast — web harness</h1>
        {/* W2: renders the SDK's <google-cast-launcher> once the SDK loads. */}
        <CastButton style={{ width: 32, height: 32 }} tintColor="#8ab4f8" />
      </header>

      <div style={S.grid}>
        <div style={S.readout}>SDK: {sdk}</div>
        <div style={S.readout}>useCastState: {castState}</div>
        <div style={S.readout}>
          useDevices: {devices.length} (web: always 0)
        </div>
        <div style={S.readout}>useCastSession: {session?.id ?? 'null'}</div>
        <div style={S.readout}>useStreamPosition: {String(position)}</div>
        <div style={S.readout}>
          useMediaStatus:{' '}
          {status
            ? `${status.playerState} pos=${status.streamPosition} dur=${status.mediaInfo?.streamDuration} vol=${status.volume} muted=${status.isMuted} items=${status.queueItems.length}`
            : 'null'}
        </div>
      </div>

      <div style={S.row}>
        {/* W3 — the browser owns the picker; `startSession(deviceId)` is a
            documented no-op-with-warning on web, so the row is showCastDialog. */}
        <Btn
          label="showCastDialog"
          onClick={() =>
            run('showCastDialog', () => GoogleCast.showCastDialog())
          }
        />
        <Btn
          label="End session"
          onClick={() =>
            run('endCurrentSession', () =>
              GoogleCast.getSessionManager().endCurrentSession(false)
            )
          }
        />
        <Btn
          label="showExpandedControls (expect false)"
          onClick={() =>
            run('showExpandedControls', () => GoogleCast.showExpandedControls())
          }
        />
      </div>

      <div style={S.row}>
        <Btn
          label="Load"
          onClick={() =>
            media('loadMedia', () =>
              client!.loadMedia({
                mediaInfo: {
                  contentUrl: FIXTURE.contentUrl,
                  contentType: FIXTURE.contentType,
                  metadata: { type: 'movie', title: FIXTURE.title },
                },
                autoplay: true,
              })
            )
          }
        />
        <Btn label="Play" onClick={() => media('play', () => client!.play())} />
        <Btn
          label="Pause"
          onClick={() => media('pause', () => client!.pause())}
        />
        <Btn
          label="Seek +30"
          onClick={() =>
            media('seek+30', () =>
              client!.seek({ position: 30, relative: true })
            )
          }
        />
        <Btn label="Stop" onClick={() => media('stop', () => client!.stop())} />
        <Btn
          label="Vol 0.3"
          onClick={() => media('vol0.3', () => client!.setStreamVolume(0.3))}
        />
      </div>

      <h2 style={S.h2}>Event log</h2>
      <pre style={S.log}>{log.join('\n')}</pre>
    </div>
  )
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button style={S.btn} onClick={onClick}>
      {label}
    </button>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: { display: 'flex', alignItems: 'center', gap: 16 },
  h1: { fontSize: 18, margin: 0, fontWeight: 600 },
  h2: { fontSize: 14, marginBottom: 4 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 4,
    marginTop: 12,
    fontSize: 12,
  },
  readout: { color: '#9aa0a6' },
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: {
    background: '#1a73e8',
    color: '#fff',
    border: 0,
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  log: {
    flex: 1,
    overflow: 'auto',
    background: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    fontSize: 11,
    color: '#9aa0a6',
    margin: 0,
  },
}

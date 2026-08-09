/**
 * Shared plumbing for the device-pass probe panels (T6).
 *
 * Deliberately tiny. The Phase 6 checklist called T6 "collapse the per-panel
 * `run` wrappers into one `probe(label, fn)`", but only **two** of the things
 * that look like wrappers actually are one — `MediaProbes` and `QueueProbes`,
 * which were byte-identical apart from their log prefix. The rest stayed where
 * they are on purpose:
 *
 * - `FlushProbe`'s `run` / `runTight` are probe *bodies* with their own settle
 *   counters, not wrappers. Collapsing them would still typecheck and would
 *   destroy the #624 evidence for checklist row 2.2.7.
 * - `fakeSeam`, `probeShow` and the channel probe's inline send each emit a
 *   *different* string, and those strings are the recorded device-pass
 *   evidence — `.maestro/tier1-fake-session.yml` asserts `fakeSeam`'s verbatim.
 *
 * Type-only imports keep this module free of runtime imports, so it adds
 * nothing for Metro or the Vite web build to resolve.
 */
import type { CastError, RemoteMediaClient } from 'react-native-google-cast';

/** Appends one line to the on-screen event log (and to `[SPIKE]` logcat). */
export type Append = (line: string) => void;

/**
 * Build the `run(label, fn)` used by a probe panel: log the settlement of a
 * façade call, or skip loudly when there is no session to call it on.
 *
 * The returned function is bound to a live `client`, so it is rebuilt on every
 * render — cheap, and it keeps the "no client" guard honest rather than
 * capturing a stale handle (Invariant 1: never cache a session handle).
 */
export function makeProbe(
  prefix: string,
  append: Append,
  client: RemoteMediaClient | null,
): (label: string, fn: () => Promise<unknown>) => void {
  return (label, fn) => {
    if (!client) {
      append(`${prefix}${label} SKIPPED — no client (connect first)`);
      return;
    }
    fn().then(
      () => append(`${prefix}${label} resolved`),
      (e: CastError) =>
        append(
          `${prefix}${label} rejected code=${e.code} native=${e.nativeCode}`,
        ),
    );
  };
}

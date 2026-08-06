import type { SessionInfo } from '../transport/types'
import type { Device } from '../types/Device'

/**
 * Web stub for the native-boundary fake seam (T3).
 *
 * The seam exists to drive the **real Nitro boundary** on an emulator or
 * simulator, where Cast discovery cannot work. On web there is no Nitro
 * boundary at all — `CastDebug` is a native HybridObject — so there is nothing
 * here to fake and nothing to prove by faking it.
 *
 * Every injector therefore resolves **`false`**, which is exactly what the
 * native seam's own contract already means: *"the seam is inactive; native did
 * not deliver this event"*. That is deliberate and it matters:
 *
 * - Returning `true` would make the seam lie. The tier-1 Maestro flow asserts
 *   on `fake session started delivered=true` precisely because a `true` there
 *   is evidence the event crossed the native boundary twice. A web stub that
 *   claimed `true` would turn that assertion from evidence into decoration.
 * - Returning `false` is honest and self-describing: the playground's event log
 *   shows `delivered=false`, which reads as "not available here" rather than as
 *   a failure.
 *
 * Tier-1 runs on Android only, so the native path is untouched either way.
 *
 * The fixtures are re-exported unchanged so importing code type-checks and
 * renders identically on both platforms.
 */

/** The synthetic receiver device used by the fake-session fixtures. */
export const FAKE_DEVICE: Device = {
  capabilities: ['VideoOut', 'AudioOut'],
  deviceId: 'fake-device-1',
  deviceVersion: '1',
  friendlyName: 'Fake Living Room TV',
  icons: [],
  ipAddress: '192.0.2.1',
  isOnLocalNetwork: true,
  modelName: 'Fake Chromecast',
}

/** The synthetic live session used by the fake-session fixtures. */
export const FAKE_SESSION: SessionInfo = {
  sessionId: 'fake-session-1',
  device: FAKE_DEVICE,
  deviceVolume: 0.5,
  deviceMuted: false,
}

/** No native boundary on web — always `false`. See the module note. */
export async function injectFakeSessionStarted(): Promise<boolean> {
  return false
}

/** No native boundary on web — always `false`. See the module note. */
export async function injectFakeSessionEnded(): Promise<boolean> {
  return false
}

/** No native boundary on web — always `false`. See the module note. */
export async function injectFakeMediaStatus(): Promise<boolean> {
  return false
}

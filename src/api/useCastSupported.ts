import { useSyncExternalStore } from 'react'
import { getCastSupported, subscribeCastSupported } from './castSupport'

/**
 * Hook that reports whether casting is possible on this platform **at all** —
 * as opposed to whether a device happens to be nearby.
 *
 * Use it to hide cast UI that could never work. It is a different question from
 * {@link useCastState}: `noDevicesAvailable` means "no receiver on this
 * network *right now*", which is temporary and worth leaving a Cast button up
 * for; `false` here means "this platform cannot cast", which is permanent.
 *
 * | Platform | `false` when                                                     |
 * | -------- | ---------------------------------------------------------------- |
 * | Android  | Google Play Services is missing, disabled, or needs updating — a GMS-less build, a Fire tablet, some Android TV boxes. {@link CastContext.getPlayServicesState} says which, and {@link CastContext.showPlayServicesErrorDialog} can prompt the user to fix it. |
 * | iOS      | never — GCK is linked into the binary                            |
 * | Web      | the browser is not Chromium-based, or the Cast Web Sender loader script is missing from the page |
 *
 * **Why a hook and not a constant.** On web this starts `false` and flips to
 * `true` when the Cast SDK finishes loading and calls
 * `window.__onGCastApiAvailable` — measured at ~50 ms on a warm localhost load,
 * with `chrome.cast` not even existing for the first ~27 ms. A value read once
 * at import time would be `false` forever, including in Chrome. On native it is
 * settled before the first render, so this simply never changes there.
 *
 * `<CastButton>` already hides itself when casting is unsupported, so you only
 * need this for surrounding UI — a settings row, a menu entry, an onboarding
 * step.
 *
 * @example
 * ```js
 * import { useCastSupported, useCastState } from 'react-native-google-cast'
 *
 * function CastSettingsRow() {
 *   const supported = useCastSupported()
 *   const state = useCastState()
 *
 *   // Permanent: this device/browser can never cast.
 *   if (!supported) return null
 *
 *   // Temporary: it can, there just isn't a receiver on the network yet.
 *   return <Row subtitle={state === 'noDevicesAvailable' ? 'No devices found' : undefined} />
 * }
 * ```
 */
export function useCastSupported(): boolean {
  return useSyncExternalStore(
    subscribeCastSupported,
    getCastSupported,
    // Server snapshot: nothing can cast during SSR.
    () => false
  )
}

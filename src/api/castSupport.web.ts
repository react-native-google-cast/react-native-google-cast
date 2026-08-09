import { isSdkPresent, subscribeSdkAvailability } from '../transport/webSdk'

/**
 * Whether this browser can cast at all.
 *
 * **This genuinely changes, which is why it is not a constant.** Measured on a
 * warm localhost load in Chrome (2026-08-09):
 *
 * | t      | state                                                        |
 * | ------ | ------------------------------------------------------------ |
 * | 0 ms   | `chrome` exists but `chrome.cast` is **undefined** → `false` |
 * | 27 ms  | the `chrome.cast` object appears                             |
 * | 50 ms  | `isAvailable` → `true`, `cast.framework` appears, the SDK calls `__onGCastApiAvailable(true)` |
 *
 * So neither half of {@link isSdkPresent} (`chrome.cast.isAvailable === true`
 * *and* `cast.framework !== undefined`) is a static property the SDK ships
 * with — both come into existence during load. A value captured at module-eval
 * time would be `false` forever, even in Chrome, because React's first render
 * happens comfortably inside that window. Hence the subscription.
 *
 * In a non-Chromium browser it simply stays `false` for good: the loader script
 * never announces itself, nothing throws, and `CastButton` renders nothing.
 */
export function getCastSupported(): boolean {
  return isSdkPresent()
}

/** Subscribe to changes in {@link getCastSupported}. */
export function subscribeCastSupported(listener: () => void): () => void {
  return subscribeSdkAvailability(listener)
}

/**
 * Access to the Google Cast Web Sender SDK globals (`window.chrome.cast` +
 * `window.cast.framework`) for the web transport.
 *
 * The SDK is not an npm package — the page includes Google's loader script
 * and the framework announces readiness through the `__onGCastApiAvailable`
 * handshake (https://developers.google.com/cast/docs/web_sender/integrate):
 *
 * ```html
 * <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
 * ```
 *
 * Everything here is typed against `@types/chromecast-caf-sender` (a
 * devDependency), but those ambient names never leak into an exported
 * signature that ships in the library's public `.d.ts` — consumers do not
 * install the Cast SDK types.
 */
import type { CastError, CastErrorCode } from '../types/CastError'

/** The `chrome.cast` (base API) namespace object. */
export type ChromeCastNamespace = typeof chrome.cast
/** The `cast.framework` (CAF sender) namespace object. */
export type CastFrameworkNamespace = typeof cast.framework

/**
 * Options the app can provide for the web transport, mirroring
 * `cast.framework.CastOptions` with the config-plugin's `receiverAppId`
 * naming. Set them on the page **before** the app bundle runs:
 *
 * ```html
 * <script>
 *   window.__RNGoogleCastOptions = { receiverAppId: 'ABCD1234' }
 * </script>
 * ```
 *
 * Omitted entirely, the transport uses the Default Media Receiver
 * (`chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID`) and Google's
 * documented `ORIGIN_SCOPED` auto-join policy. The transport owns the
 * `CastContext.setOptions` call — apps should not call it themselves.
 */
export interface WebCastOptions {
  /** Receiver application id. Default: the Default Media Receiver. */
  receiverAppId?: string
  /** `chrome.cast.AutoJoinPolicy` value. Default `'origin_scoped'`. */
  autoJoinPolicy?: string
  /** Language for the receiver, e.g. `'en'`. */
  language?: string
  /** Reconnect to a session left running on page reload. Default `true` (SDK default). */
  resumeSavedSession?: boolean
  /** Allow casting to audio-only devices via an Android TV receiver. */
  androidReceiverCompatible?: boolean
}

/**
 * The subset of `window` the transport touches, accessed through `globalThis`
 * so this module is safe to import (and the transport safe to construct) in
 * non-browser environments — SSR / jest simply see no SDK.
 */
interface CastGlobal {
  chrome?: { cast?: ChromeCastNamespace }
  cast?: { framework?: CastFrameworkNamespace }
  __onGCastApiAvailable?: (available: boolean, reason?: string) => void
  __RNGoogleCastOptions?: WebCastOptions
  /**
   * Structurally typed rather than pulled in via the DOM lib: this package is a
   * React Native library and its tsconfig deliberately omits `dom`, so that
   * `document`/`window` cannot be referenced from code that also runs on
   * native. Only the one method needed is declared.
   */
  document?: { querySelector(selectors: string): unknown }
}

const castGlobal = (): CastGlobal => globalThis as CastGlobal

/** The base `chrome.cast` namespace, if the SDK has loaded. */
export function getChromeCast(): ChromeCastNamespace | undefined {
  return castGlobal().chrome?.cast
}

/** The `cast.framework` namespace, if the framework has loaded. */
export function getCastFramework(): CastFrameworkNamespace | undefined {
  return castGlobal().cast?.framework
}

/**
 * Whether the Web Sender SDK (base API + CAF framework) is loaded and usable
 * right now. `chrome.cast.isAvailable` is the SDK's own readiness flag
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast#.isAvailable).
 */
export function isSdkPresent(): boolean {
  const chromeCast = getChromeCast()
  return chromeCast?.isAvailable === true && getCastFramework() !== undefined
}

/**
 * Whether the Cast Web Sender loader script is present in the document.
 *
 * Used only to tell two very different failures apart when the SDK is not
 * usable: **the page forgot the script** (fixable — add it) versus **the
 * browser cannot cast** (not fixable, and telling the developer to add a script
 * they already have sends them the wrong way entirely).
 *
 * Deliberately a DOM check rather than a `chrome.cast` check: in a non-Chromium
 * browser the script is fetched and simply never announces itself, so the
 * globals look identical to the script being absent.
 */
export function isLoaderScriptPresent(): boolean {
  const doc = castGlobal().document
  if (doc === undefined) return false
  return doc.querySelector('script[src*="cast_sender.js"]') != null
}

/**
 * Register for the SDK's readiness handshake. The loader script calls
 * `window.__onGCastApiAvailable(available)` once the framework is ready
 * (https://developers.google.com/cast/docs/web_sender/integrate). Any handler
 * the page installed first is chained (called before `callback`), so an app's
 * own hook keeps working.
 */
export function onSdkAvailable(callback: (available: boolean) => void): void {
  const target = castGlobal()
  const previous = target.__onGCastApiAvailable
  target.__onGCastApiAvailable = (available: boolean, reason?: string) => {
    previous?.(available, reason)
    callback(available)
  }
}

const availabilityListeners = new Set<() => void>()
let availabilityHookInstalled = false

/**
 * Subscribe to SDK-availability changes (a `useSyncExternalStore`-shaped
 * seam for UI like `CastButton.web`). Returns an unsubscribe function, so —
 * unlike raw {@link onSdkAvailable}, whose handler chain only ever grows —
 * mounting/unmounting components does not accumulate handlers: one shared
 * hook fans out to a Set. If the global hook slot was cleared after install
 * (tests), the next subscribe reinstalls it; a duplicate chained hook only
 * causes redundant notifications, which snapshot reads make harmless.
 */
export function subscribeSdkAvailability(listener: () => void): () => void {
  if (
    !availabilityHookInstalled ||
    castGlobal().__onGCastApiAvailable === undefined
  ) {
    availabilityHookInstalled = true
    onSdkAvailable(() => {
      for (const l of [...availabilityListeners]) l()
    })
  }
  availabilityListeners.add(listener)
  return () => {
    availabilityListeners.delete(listener)
  }
}

/** The app-provided {@link WebCastOptions}, if any. */
export function getWebCastOptions(): WebCastOptions {
  return castGlobal().__RNGoogleCastOptions ?? {}
}

/**
 * Build the `cast.framework.CastOptions` for `CastContext.setOptions` from
 * the app-provided globals + documented defaults (Default Media Receiver,
 * `ORIGIN_SCOPED` — the values Google's integration guide uses).
 */
export function buildCastOptions(
  chromeCast: ChromeCastNamespace
): cast.framework.CastOptions {
  const provided = getWebCastOptions()
  const options: cast.framework.CastOptions = {
    receiverApplicationId:
      provided.receiverAppId ?? chromeCast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: (provided.autoJoinPolicy ??
      'origin_scoped') as chrome.cast.AutoJoinPolicy,
  }
  if (provided.language !== undefined) options.language = provided.language
  if (provided.resumeSavedSession !== undefined) {
    options.resumeSavedSession = provided.resumeSavedSession
  }
  if (provided.androidReceiverCompatible !== undefined) {
    options.androidReceiverCompatible = provided.androidReceiverCompatible
  }
  return options
}

// --- error mapping ---

/**
 * `chrome.cast.ErrorCode` → typed {@link CastErrorCode}
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast#.ErrorCode).
 * The raw web code string is preserved in the message; `nativeCode` stays
 * unset (web codes are strings, not integers).
 */
const WEB_ERROR_CODE_MAP: Record<string, CastErrorCode> = {
  cancel: 'cancelled',
  timeout: 'timeout',
  api_not_initialized: 'invalidRequest',
  invalid_parameter: 'invalidParameter',
  extension_not_compatible: 'notSupported',
  extension_missing: 'notSupported',
  receiver_unavailable: 'network',
  session_error: 'noSession',
  channel_error: 'network',
  load_media_failed: 'failed',
}

/** Extract the `chrome.cast.ErrorCode` string from an SDK failure payload. */
export function webErrorCode(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'code' in raw) {
    const code = (raw as { code: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}

/**
 * Translate an SDK failure — a `chrome.cast.Error`, a bare `ErrorCode`
 * string (what `requestSession()` rejects with), or anything else — into a
 * typed {@link CastError}. A payload that is already a `CastError` (thrown by
 * this transport itself) passes through unchanged.
 */
export function toCastError(raw: unknown): CastError {
  const code = webErrorCode(raw)
  if (code && WEB_ERROR_CODE_MAP[code]) {
    // A web SDK failure (chrome.cast.Error or bare ErrorCode string). Checked
    // FIRST: `timeout` exists in both code spaces and must map as the web one.
    const description =
      raw && typeof raw === 'object' && 'description' in raw
        ? (raw as { description: unknown }).description
        : undefined
    return {
      code: WEB_ERROR_CODE_MAP[code],
      message:
        typeof description === 'string' && description
          ? `${description} (${code})`
          : `Cast Web Sender error: ${code}`,
    }
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'code' in raw &&
    typeof (raw as { code: unknown }).code === 'string' &&
    (raw as { code: string }).code in
      ({
        noSession: 1,
        notSupported: 1,
        network: 1,
        timeout: 1,
        cancelled: 1,
        interrupted: 1,
        failed: 1,
        invalidParameter: 1,
        invalidRequest: 1,
        authentication: 1,
        notAllowed: 1,
        appNotFound: 1,
        alreadyRegistered: 1,
      } satisfies Record<CastErrorCode, 1>)
  ) {
    return raw as CastError
  }
  return {
    code: 'failed',
    message: `Cast Web Sender error: ${String(raw)}`,
  }
}

import type { CastError, CastErrorCode } from '../types/CastError'

/**
 * Translates a raw native rejection into a typed {@link CastError}.
 *
 * This is the **single swappable spot** for Nitro error propagation (plan
 * critical-gap #12). Promise-rejection payloads are the one FFI channel whose
 * structured-object fidelity is unverified across the Nitro bridge, so the
 * native side encodes the error as a JSON string in the thrown error's
 * `message` (`{"code","message","nativeCode"}`, assembled from the landed
 * `GckError→CastError` mappers) and we parse it back here. A string is the one
 * thing guaranteed to survive any FFI — keeping this behind the adapter means
 * the store and façades never depend on how the bridge marshals errors. If the
 * device spike later proves Nitro preserves structured errors, only this file
 * changes.
 */
const KNOWN_CODES: readonly CastErrorCode[] = [
  'noSession',
  'notSupported',
  'network',
  'timeout',
  'cancelled',
  'interrupted',
  'failed',
  'invalidParameter',
  'invalidRequest',
  'authentication',
  'notAllowed',
  'appNotFound',
]

function isCastErrorCode(value: unknown): value is CastErrorCode {
  return (
    typeof value === 'string' &&
    (KNOWN_CODES as readonly string[]).includes(value)
  )
}

interface EmbeddedError {
  code?: unknown
  message?: unknown
  nativeCode?: unknown
}

/**
 * Parse a JSON `CastError` payload out of a native error message, tolerating a
 * surrounding wrapper the bridge may add (e.g. `Error: {...}`): we try the whole
 * message first, then the `{...}` substring.
 */
function tryParseEmbedded(message: string): EmbeddedError | null {
  const candidates = [message]
  const open = message.indexOf('{')
  const close = message.lastIndexOf('}')
  if (open !== -1 && close > open)
    candidates.push(message.slice(open, close + 1))
  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') return parsed as EmbeddedError
    } catch {
      // not JSON — try the next candidate
    }
  }
  return null
}

export function parseCastError(raw: unknown): CastError {
  if (
    raw &&
    typeof raw === 'object' &&
    isCastErrorCode((raw as CastError).code)
  ) {
    // Already a structured CastError (e.g. the bridge preserved it, or a TS
    // layer threw one) — pass through unchanged.
    return raw as CastError
  }
  const message = raw instanceof Error ? raw.message : String(raw)
  const embedded = tryParseEmbedded(message)
  if (embedded && isCastErrorCode(embedded.code)) {
    const result: CastError = { code: embedded.code }
    if (typeof embedded.message === 'string') result.message = embedded.message
    if (typeof embedded.nativeCode === 'number')
      result.nativeCode = embedded.nativeCode
    return result
  }
  return { code: 'failed', message }
}

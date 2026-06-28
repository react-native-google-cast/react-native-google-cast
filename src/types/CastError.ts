/**
 * Typed error codes surfaced by every async Cast operation.
 *
 * These codes are produced either by the native GCKError mapper (Phase 3/4
 * reject sites) or by the TS façade/state machine for logical errors
 * such as {@link noSession} and {@link notSupported}.
 *
 * @see [Android CastStatusCodes](https://developers.google.com/android/reference/com/google/android/gms/cast/CastStatusCodes)
 * @see [iOS GCKErrorCode](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_error)
 */
export type CastErrorCode =
  /** No active Cast session; operation requires one. Produced by the TS state machine. */
  | 'noSession'
  /** Feature is not supported on this device or platform. */
  | 'notSupported'
  /** Network I/O error or device not reachable. */
  | 'network'
  /** Operation exceeded the allowed time limit. */
  | 'timeout'
  /** Operation was cancelled (typically by the sender). */
  | 'cancelled'
  /** Operation was interrupted, e.g. replaced by a newer request or app backgrounded. */
  | 'interrupted'
  /** Generic failure not covered by a more specific code. */
  | 'failed'
  /** A parameter passed to a native API was invalid. */
  | 'invalidParameter'
  /** The request was structurally invalid or made in the wrong state. */
  | 'invalidRequest'
  /** Device authentication or TLS/cert error. */
  | 'authentication'
  /** The sender is not authorised to perform the operation. */
  | 'notAllowed'
  /** The requested Cast application could not be found or is not running. */
  | 'appNotFound'

/**
 * Structured error returned by async Cast operations.
 *
 * `code` is always present and is the primary discrimination key.
 * `message` is the human-readable GCK description (locale-dependent).
 * `nativeCode` is the raw platform error integer for diagnostics; assembled at reject sites in Phase 3/4.
 */
export interface CastError {
  /** Typed error-code string literal. */
  code: CastErrorCode
  /** Optional human-readable description from the native SDK. */
  message?: string
  /** Raw platform error integer (`GCKErrorCode` on iOS, `CastStatusCodes` on Android). */
  nativeCode?: number
}

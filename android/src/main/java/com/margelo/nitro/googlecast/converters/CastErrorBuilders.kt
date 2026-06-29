package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.CastError
import com.margelo.nitro.googlecast.CastErrorCode
import org.json.JSONObject

/** Maps the `CastErrorCode` string-literal back to the generated Nitro enum. */
internal fun castErrorCode(value: String): CastErrorCode =
  when (value) {
    "noSession" -> CastErrorCode.NOSESSION
    "notSupported" -> CastErrorCode.NOTSUPPORTED
    "network" -> CastErrorCode.NETWORK
    "timeout" -> CastErrorCode.TIMEOUT
    "cancelled" -> CastErrorCode.CANCELLED
    "interrupted" -> CastErrorCode.INTERRUPTED
    "invalidParameter" -> CastErrorCode.INVALIDPARAMETER
    "invalidRequest" -> CastErrorCode.INVALIDREQUEST
    "authentication" -> CastErrorCode.AUTHENTICATION
    "notAllowed" -> CastErrorCode.NOTALLOWED
    "appNotFound" -> CastErrorCode.APPNOTFOUND
    else -> CastErrorCode.FAILED
  }

/** Build the typed `CastError` struct streamed in lifecycle events. */
internal fun castErrorFromStatusCode(statusCode: Int, message: String?): CastError =
  CastError(
    castErrorCode(castErrorCodeFromGckStatusCode(statusCode)),
    message,
    statusCode.toDouble()
  )

/**
 * JSON-encode a rejection payload for a mutation `Promise.reject` — the native
 * side of the TS `parseCastError` translation (critical-gap #12). A string is
 * the one channel guaranteed to survive the Nitro promise-rejection bridge.
 */
internal fun castRejectionJson(code: String, message: String?, nativeCode: Int?): String {
  val obj = JSONObject()
  obj.put("code", code)
  if (message != null) obj.put("message", message)
  if (nativeCode != null) obj.put("nativeCode", nativeCode)
  return obj.toString()
}

/** A `Throwable` whose message is a JSON `CastError` payload. */
internal class CastRejection(json: String) : RuntimeException(json)

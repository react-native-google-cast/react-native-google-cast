package com.margelo.nitro.googlecast.converters

import com.google.android.gms.cast.CastStatusCodes

/**
 * Maps a [CastStatusCodes] integer to a `CastErrorCode` string literal (the TS string-literal union).
 *
 * Phase 3/4 reject sites will assemble the full `CastError` struct using this code plus the
 * exception/status message and the raw status code as `nativeCode`.
 *
 * Default for any unrecognised code → `"failed"`.
 */
internal fun castErrorCodeFromGckStatusCode(statusCode: Int): String = when (statusCode) {
  CastStatusCodes.NETWORK_ERROR -> "network"
  CastStatusCodes.TIMEOUT -> "timeout"
  CastStatusCodes.INTERRUPTED -> "interrupted"
  CastStatusCodes.REPLACED -> "interrupted"
  CastStatusCodes.CANCELED -> "cancelled"
  CastStatusCodes.AUTHENTICATION_FAILED -> "authentication"
  CastStatusCodes.INVALID_REQUEST -> "invalidRequest"
  CastStatusCodes.NOT_ALLOWED,
  CastStatusCodes.ERROR_HOST_NOT_ALLOWED -> "notAllowed"
  CastStatusCodes.APPLICATION_NOT_FOUND,
  CastStatusCodes.APPLICATION_NOT_RUNNING -> "appNotFound"
  CastStatusCodes.DEVICE_CONNECTION_SUSPENDED,
  CastStatusCodes.ERROR_CAST_PLATFORM_NOT_CONNECTED,
  CastStatusCodes.ERROR_SERVICE_DISCONNECTED -> "noSession"
  else -> "failed"
}

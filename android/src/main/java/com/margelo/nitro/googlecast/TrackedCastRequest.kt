package com.margelo.nitro.googlecast

import com.google.android.gms.common.api.PendingResult
import com.google.android.gms.common.api.Result
import com.google.android.gms.common.api.Status
import com.margelo.nitro.googlecast.converters.CastRejection
import com.margelo.nitro.googlecast.converters.castErrorCodeFromGckStatusCode
import com.margelo.nitro.googlecast.converters.castRejectionJson

/**
 * Bridges a single in-flight GCK [PendingResult] to one promise, settling it
 * **exactly once** (T6 async-request ownership). Android mirror of the iOS
 * `CastRequestDelegate`.
 *
 * Ownership model:
 * - The transport retains this object in its `pendingRequests` registry until it
 *   settles; [onSettled] releases the registry slot the instant it does.
 * - The first of {result callback, external cancel} wins; every later call is a
 *   no-op thanks to the `settled` guard.
 * - [cancel] lets the transport reject still-pending requests on session
 *   end/suspend and on `dispose()` (RN reload). It also cancels the GCK
 *   [PendingResult], which per the SDK contract suppresses a later result
 *   callback — but the `settled` guard alone already makes one harmless.
 *
 * All access is main-thread (every request here is issued on the main thread and
 * GMS delivers result callbacks on the main thread), so the mutable
 * `settled`/`pending` state needs no locking.
 *
 * The promise is injected as [resolve]/[reject] lambdas (not a Nitro `Promise`)
 * solely so the exactly-once contract is JVM-unit-testable — Nitro's `Promise`
 * is JNI-backed and cannot be constructed off-device.
 */
internal class TrackedCastRequest(
  private val resolve: () -> Unit,
  private val reject: (Throwable) -> Unit,
  private val onSettled: (TrackedCastRequest) -> Unit,
) {
  private var pending: PendingResult<*>? = null
  private var settled = false

  /** Retain [pending] and subscribe its single result callback. Main thread. */
  fun <R : Result> track(pending: PendingResult<R>) {
    this.pending = pending
    pending.setResultCallback { result -> onResult(result.status) }
  }

  /**
   * Reject a still-pending request from outside (session teardown / dispose)
   * and cancel the underlying GCK request. No-op once settled. Main thread.
   */
  fun cancel(code: String, message: String) {
    settle {
      pending?.cancel()
      reject(CastRejection(castRejectionJson(code, message, null)))
    }
  }

  private fun onResult(status: Status) {
    settle {
      if (status.isSuccess) {
        resolve()
      } else {
        reject(
          CastRejection(
            castRejectionJson(
              castErrorCodeFromGckStatusCode(status.statusCode),
              status.statusMessage,
              status.statusCode
            )
          )
        )
      }
    }
  }

  private inline fun settle(body: () -> Unit) {
    if (settled) return
    settled = true
    try {
      body()
    } finally {
      pending = null
      onSettled(this)
    }
  }
}

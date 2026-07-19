package com.margelo.nitro.googlecast

import com.google.android.gms.common.api.PendingResult
import com.google.android.gms.common.api.ResultCallback
import com.google.android.gms.common.api.Status
import com.margelo.nitro.googlecast.converters.CastRejection
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pins the exactly-once settlement contract of [TrackedCastRequest] (T6 async-request
 * ownership): first of {result, cancel} wins, later calls are no-ops, the GCK
 * [PendingResult] is cancelled only by an external cancel, and the registry slot
 * ([onSettled]) is released exactly once. Plain JUnit — the class is main-thread-affine
 * but has no Looper/Handler dependency.
 */
class TrackedCastRequestTest {

  private class FakePendingResult : PendingResult<Status>() {
    var callback: ResultCallback<in Status>? = null
    var cancelled = false

    override fun await(): Status = throw UnsupportedOperationException()
    override fun await(time: Long, units: TimeUnit): Status = throw UnsupportedOperationException()
    override fun cancel() {
      cancelled = true
    }
    override fun isCanceled(): Boolean = cancelled
    override fun setResultCallback(callback: ResultCallback<in Status>) {
      this.callback = callback
    }
    override fun setResultCallback(
      callback: ResultCallback<in Status>,
      time: Long,
      units: TimeUnit
    ) {
      this.callback = callback
    }
  }

  private class Harness {
    var resolves = 0
    val rejections = mutableListOf<Throwable>()
    val settled = mutableListOf<TrackedCastRequest>()
    val pending = FakePendingResult()
    val request =
      TrackedCastRequest(
        resolve = { resolves++ },
        reject = { rejections.add(it) },
        onSettled = { settled.add(it) },
      )

    init {
      request.track(pending)
    }

    fun deliver(status: Status) {
      pending.callback!!.onResult(status)
    }
  }

  @Test
  fun `success resolves exactly once`() {
    val h = Harness()
    h.deliver(Status(0))
    h.deliver(Status(0)) // duplicate delivery must be a no-op
    assertEquals(1, h.resolves)
    assertEquals(0, h.rejections.size)
    assertEquals(listOf(h.request), h.settled)
  }

  @Test
  fun `failure rejects exactly once with the GCK status code`() {
    val h = Harness()
    h.deliver(Status(2103, "interrupted by new request"))
    assertEquals(0, h.resolves)
    assertEquals(1, h.rejections.size)
    val rejection = h.rejections.single()
    assertTrue(rejection is CastRejection)
    assertNotNull(rejection.message)
    assertTrue("carries nativeCode", rejection.message!!.contains("2103"))
    assertEquals(listOf(h.request), h.settled)
  }

  @Test
  fun `external cancel rejects the promise and cancels the GCK request`() {
    val h = Harness()
    h.request.cancel("interrupted", "The Cast session ended.")
    assertTrue(h.pending.cancelled)
    assertEquals(0, h.resolves)
    assertEquals(1, h.rejections.size)
    assertTrue(h.rejections.single().message!!.contains("interrupted"))
    assertEquals(listOf(h.request), h.settled)
    // A straggler result after cancel must be swallowed (settled guard).
    h.deliver(Status(0))
    assertEquals(0, h.resolves)
    assertEquals(1, h.rejections.size)
    assertEquals(1, h.settled.size)
  }

  @Test
  fun `cancel after settlement is a no-op and does not cancel the GCK request`() {
    val h = Harness()
    h.deliver(Status(0))
    h.request.cancel("interrupted", "The Cast transport was disposed.")
    assertFalse(h.pending.cancelled)
    assertEquals(1, h.resolves)
    assertEquals(0, h.rejections.size)
    assertEquals(1, h.settled.size)
  }
}

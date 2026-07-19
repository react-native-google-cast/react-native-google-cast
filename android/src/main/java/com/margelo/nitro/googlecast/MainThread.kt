package com.margelo.nitro.googlecast

import android.content.pm.ApplicationInfo
import android.os.Looper
import com.margelo.nitro.NitroModules

/**
 * Debug-only main-thread assertion — the Android analogue of the iOS
 * `dispatchPrecondition(condition: .onQueue(.main))` calls (threading policy:
 * all GCK access and every listener-registry mutation is main-thread-only).
 *
 * Armed only when the *host app* is debuggable (same gating as
 * [CastDebugEventSink] — a source-built library has no compile-time debug
 * split of its own): a debug app crashes loudly on a violation, a release app
 * skips the check entirely.
 */
internal object MainThread {
  // `Throwable` (not `Exception`): touching `NitroModules` class-loads Nitro's
  // native library, which throws `UnsatisfiedLinkError` in a JVM unit test —
  // an assertion helper must never be the thing that crashes a test host.
  private val isHostDebuggable: Boolean
    get() =
      try {
        val context = NitroModules.applicationContext
        context != null &&
          (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
      } catch (t: Throwable) {
        false
      }

  /** Asserts [what] is running on the main thread (debuggable hosts only). */
  fun assertMainThread(what: String) {
    val mainLooper = Looper.getMainLooper() ?: return // JVM test host — no looper
    if (!isHostDebuggable) return
    check(Looper.myLooper() == mainLooper) {
      "$what must run on the main thread (was: ${Thread.currentThread().name})"
    }
  }
}

package com.margelo.nitro.googlecast

import android.content.pm.ApplicationInfo
import com.margelo.nitro.NitroModules

/**
 * Debug-only fake seam (T3): hands `HybridCastDebug.inject*` the *same* stored
 * `initAndSubscribe` callbacks the real GCK listeners invoke on
 * [HybridCastTransport], so tier-1 Maestro E2E can drive the real Nitro
 * boundary (native → JS callback delivery) on an emulator where Cast discovery
 * cannot work.
 *
 * All gating lives here: Android has no compile-time debug split for
 * source-built libraries, so the seam is armed only when the *host app* is
 * debuggable (`ApplicationInfo.FLAG_DEBUGGABLE`). The transport calls
 * [attach]/[detach] unconditionally; in a non-debuggable (release) app both
 * no-op and [current] always returns null.
 *
 * Threading: [attach] runs on the JS thread inside `initAndSubscribe`
 * (mirroring the transport's own callback-var assignment); [current] is read
 * by `HybridCastDebug.inject*`, which posts delivery to the main thread,
 * matching real GCK main-thread event delivery.
 */
internal object CastDebugEventSink {
  internal class Emitters(
    val emitState: (CastState) -> Unit,
    val emitDevices: (Array<Device>) -> Unit,
    val emitLifecycle: (SessionLifecycleEvent) -> Unit,
    val emitMediaStatus: (MediaStatus) -> Unit,
  )

  @Volatile private var emitters: Emitters? = null

  private val isHostDebuggable: Boolean
    get() {
      val context = NitroModules.applicationContext ?: return false
      return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    }

  /**
   * Called by `HybridCastTransport.initAndSubscribe` right after it stores the
   * JS callbacks. The closures must read the transport's *current* callback
   * vars (not capture the parameters), so a later `dispose()` nulling them
   * also silences the seam.
   */
  fun attach(newEmitters: Emitters) {
    if (isHostDebuggable) emitters = newEmitters
  }

  /** Called by `HybridCastTransport.dispose()`. */
  fun detach() {
    emitters = null
  }

  /** The live emitters, or null when the seam is inactive. */
  fun current(): Emitters? = if (isHostDebuggable) emitters else null
}

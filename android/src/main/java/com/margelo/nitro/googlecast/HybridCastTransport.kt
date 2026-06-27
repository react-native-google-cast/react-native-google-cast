package com.margelo.nitro.googlecast

import android.os.Handler
import android.os.Looper
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastState as GckCastState
import com.google.android.gms.cast.framework.CastStateListener
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.margelo.nitro.NitroModules
import java.util.concurrent.ConcurrentHashMap

/**
 * Nitro implementation of the singleton Cast transport (Android), backed by the
 * Google Cast SDK (play-services-cast-framework).
 *
 * Design notes (see plan: "thin Nitro bridge + fat TypeScript"):
 * - The only stateful native object; TS façades + the central session-state
 *   machine route through it.
 * - All GCK access happens on the main thread. The current cast state is cached
 *   so `getCastState()` is a cheap, thread-safe read (avoids a sync thread hop
 *   in a Nitro getter — Codex #3 / T6).
 * - Graceful degradation when Google Play Services is unavailable/outdated
 *   (the class of crash fixed in v4 #550): `isAvailable` is false and GCK calls
 *   are skipped rather than throwing.
 *
 * TODO(Phase 2/3): move the Int→CastState conversion into a dedicated
 * `CastState+fromGck.kt` converter file per the build-nitro-modules conventions.
 */
class HybridCastTransport : HybridCastTransportSpec() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val listeners = ConcurrentHashMap<Long, CastStateListener>()
  private var nextId = 0L

  @Volatile
  private var cachedState: CastState = CastState.NOTCONNECTED

  init {
    runOnMain { cachedState = readCurrentState() }
  }

  override val isAvailable: Boolean
    get() {
      val context = NitroModules.applicationContext ?: return false
      return GoogleApiAvailability.getInstance()
        .isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
    }

  override fun getCastState(): CastState = cachedState

  override fun addCastStateListener(
    listener: (state: CastState) -> Unit
  ): ListenerSubscription {
    val id = synchronized(this) { nextId++ }
    runOnMain {
      val castContext = sharedCastContextOrNull()
      if (castContext == null) {
        // Unavailable: replay current (default) state, skip registration.
        listener(cachedState)
        return@runOnMain
      }
      val gckListener = CastStateListener { newState ->
        cachedState = mapState(newState)
        listener(cachedState)
      }
      castContext.addCastStateListener(gckListener)
      listeners[id] = gckListener
      // Late-subscriber replay.
      cachedState = mapState(castContext.castState)
      listener(cachedState)
    }
    return ListenerSubscription(remove = {
      runOnMain {
        val gckListener = listeners.remove(id) ?: return@runOnMain
        sharedCastContextOrNull()?.removeCastStateListener(gckListener)
      }
    })
  }

  // MARK: - GCK wiring (main thread only)

  private fun readCurrentState(): CastState =
    sharedCastContextOrNull()?.let { mapState(it.castState) }
      ?: CastState.NODEVICESAVAILABLE

  private fun sharedCastContextOrNull(): CastContext? {
    val context = NitroModules.applicationContext ?: return null
    return try {
      CastContext.getSharedInstance(context)
    } catch (e: Exception) {
      // Play Services missing/outdated (cf. v4 #550) — degrade gracefully.
      null
    }
  }

  private fun runOnMain(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) block() else mainHandler.post(block)
  }

  private fun mapState(gckState: Int): CastState = when (gckState) {
    GckCastState.NO_DEVICES_AVAILABLE -> CastState.NODEVICESAVAILABLE
    GckCastState.NOT_CONNECTED -> CastState.NOTCONNECTED
    GckCastState.CONNECTING -> CastState.CONNECTING
    GckCastState.CONNECTED -> CastState.CONNECTED
    else -> CastState.NOTCONNECTED
  }
}

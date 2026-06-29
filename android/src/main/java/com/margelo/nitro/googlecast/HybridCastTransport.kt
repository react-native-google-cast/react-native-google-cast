package com.margelo.nitro.googlecast

import android.os.Handler
import android.os.Looper
import androidx.mediarouter.media.MediaRouter
import com.google.android.gms.cast.CastDevice
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.CastState as GckCastState
import com.google.android.gms.cast.framework.CastStateListener
import com.google.android.gms.cast.framework.SessionManagerListener
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.googlecast.converters.CastRejection
import com.margelo.nitro.googlecast.converters.castErrorFromStatusCode
import com.margelo.nitro.googlecast.converters.castRejectionJson
import com.margelo.nitro.googlecast.converters.fromGckConnectionResult
import com.margelo.nitro.googlecast.converters.toDevice

/**
 * Nitro implementation of the singleton Cast transport (Android), backed by the
 * Google Cast SDK (play-services-cast-framework) + AndroidX MediaRouter.
 *
 * Design (see plan: "thin Nitro bridge + fat TypeScript"):
 * - The only stateful native object; the TS `CastStore` is its single long-lived
 *   subscriber and serves public reads synchronously from its own cache.
 * - **All GCK access is on the main thread.**
 * - **Invariant 1 (no cached handle for operations):** every mutation re-resolves
 *   the current session / route from the GCK + MediaRouter singletons per call —
 *   nothing here caches a `CastSession` for later use, so there is no stale
 *   handle to crash on after disconnect.
 * - **Graceful degradation** when Play Services is unavailable (`isAvailable`
 *   false, GCK calls skipped) — the class of crash fixed in v4 #550.
 *
 * NOTE: the device-gated behaviours (real GCK event delivery, error
 * `code`+`nativeCode` across the bridge, clean teardown) are verified by the
 * Phase 3 native spike on an emulator/device — see the spike checklist.
 */
class HybridCastTransport : HybridCastTransportSpec() {
  private val mainHandler = Handler(Looper.getMainLooper())

  private var onState: ((CastState) -> Unit)? = null
  private var onDevices: ((Array<Device>) -> Unit)? = null
  private var onLifecycle: ((SessionLifecycleEvent) -> Unit)? = null

  private var castStateListener: CastStateListener? = null
  private var sessionListener: SessionManagerListener<CastSession>? = null
  private var routerCallback: MediaRouter.Callback? = null
  private var listenersAttached = false

  @Volatile private var cachedCastState: CastState = CastState.NOTCONNECTED
  @Volatile private var cachedDiscovering = false
  @Volatile private var cachedPassiveScan = false

  override val isAvailable: Boolean
    get() {
      val context = NitroModules.applicationContext ?: return false
      return GoogleApiAvailability.getInstance()
        .isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
    }

  override val isDiscovering: Boolean
    get() = cachedDiscovering

  override val isPassiveScan: Boolean
    get() = cachedPassiveScan

  // MARK: - init + subscribe (atomic, main thread)

  override fun initAndSubscribe(
    onState: (castState: CastState) -> Unit,
    onDevices: (devices: Array<Device>) -> Unit,
    onLifecycle: (event: SessionLifecycleEvent) -> Unit
  ): Promise<InitialSnapshot> {
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle

    val promise = Promise<InitialSnapshot>()
    runOnMain {
      val castContext = sharedCastContextOrNull()
      if (castContext == null) {
        // Unavailable: seed safe defaults but still surface the diagnostic.
        promise.resolve(
          InitialSnapshot(
            CastState.NODEVICESAVAILABLE,
            playServicesState(),
            emptyArray(),
            null
          )
        )
        return@runOnMain
      }
      attachObservers(castContext)
      cachedCastState = mapState(castContext.castState)
      val current = sessionInfo(castContext.sessionManager.currentCastSession)
      promise.resolve(
        InitialSnapshot(cachedCastState, playServicesState(), readDevices(), current)
      )
    }
    return promise
  }

  private fun attachObservers(castContext: CastContext) {
    if (listenersAttached) return
    listenersAttached = true

    castStateListener =
      CastStateListener { newState ->
        cachedCastState = mapState(newState)
        onState?.invoke(cachedCastState)
      }
        .also { castContext.addCastStateListener(it) }

    sessionListener =
      sessionManagerListener().also {
        castContext.sessionManager.addSessionManagerListener(it, CastSession::class.java)
      }

    val router = MediaRouter.getInstance(NitroModules.applicationContext!!)
    val selector = castContext.mergedSelector
    if (selector != null) {
      routerCallback =
        object : MediaRouter.Callback() {
          override fun onRouteAdded(r: MediaRouter, route: MediaRouter.RouteInfo) = emitDevices()
          override fun onRouteRemoved(r: MediaRouter, route: MediaRouter.RouteInfo) = emitDevices()
          override fun onRouteChanged(r: MediaRouter, route: MediaRouter.RouteInfo) = emitDevices()
        }
          .also {
            router.addCallback(selector, it, MediaRouter.CALLBACK_FLAG_REQUEST_DISCOVERY)
          }
    }
  }

  private fun detachObservers() {
    if (!listenersAttached) return
    listenersAttached = false
    val castContext = sharedCastContextOrNull()
    castStateListener?.let { castContext?.removeCastStateListener(it) }
    sessionListener?.let {
      castContext?.sessionManager?.removeSessionManagerListener(it, CastSession::class.java)
    }
    routerCallback?.let {
      NitroModules.applicationContext?.let { ctx ->
        MediaRouter.getInstance(ctx).removeCallback(it)
      }
    }
    castStateListener = null
    sessionListener = null
    routerCallback = null
  }

  override fun dispose() {
    runOnMain {
      detachObservers()
      onState = null
      onDevices = null
      onLifecycle = null
    }
    super.dispose()
  }

  // MARK: - mutations (re-resolve handles per call — Invariant 1)

  override fun startSession(deviceId: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val context = NitroModules.applicationContext
      if (context == null) {
        promise.reject(CastRejection(castRejectionJson("failed", "No application context", null)))
        return@runOnMain
      }
      val router = MediaRouter.getInstance(context)
      val route =
        router.routes.firstOrNull {
          CastDevice.getFromBundle(it.extras)?.deviceId == deviceId
        }
      if (route == null) {
        promise.reject(
          CastRejection(
            castRejectionJson("appNotFound", "No Cast device with id $deviceId", null)
          )
        )
        return@runOnMain
      }
      // Selecting the route starts the session; the started/failed outcome streams
      // back as a lifecycle event.
      router.selectRoute(route)
      promise.resolve(Unit)
    }
    return promise
  }

  override fun endCurrentSession(stopCasting: Boolean): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val castContext = sharedCastContextOrNull()
      if (castContext == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No current session to end.", null))
        )
        return@runOnMain
      }
      castContext.sessionManager.endCurrentSession(stopCasting)
      promise.resolve(Unit)
    }
    return promise
  }

  // MARK: - discovery controls (no-op on Android; MediaRouter drives discovery)

  override fun startDiscovery() {
    cachedDiscovering = true
  }

  override fun stopDiscovery() {
    cachedDiscovering = false
  }

  override fun setPassiveScan(passive: Boolean) {
    cachedPassiveScan = passive
  }

  // MARK: - GCK session lifecycle (main thread)

  private fun sessionManagerListener() =
    object : SessionManagerListener<CastSession> {
      override fun onSessionStarting(session: CastSession) =
        emit(SessionEventType.STARTING, deviceId = session.castDevice?.deviceId)
      override fun onSessionStarted(session: CastSession, sessionId: String) =
        emit(SessionEventType.STARTED, session = sessionInfo(session, sessionId))
      override fun onSessionStartFailed(session: CastSession, error: Int) =
        emit(SessionEventType.STARTFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionEnding(session: CastSession) =
        emit(SessionEventType.ENDING, session = sessionInfo(session))
      override fun onSessionEnded(session: CastSession, error: Int) =
        emit(
          SessionEventType.ENDED,
          error = if (error != 0) castErrorFromStatusCode(error, null) else null
        )
      override fun onSessionResuming(session: CastSession, sessionId: String) =
        emit(SessionEventType.RESUMING, sessionId = sessionId)
      override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) =
        emit(SessionEventType.RESUMED, session = sessionInfo(session))
      override fun onSessionResumeFailed(session: CastSession, error: Int) =
        emit(SessionEventType.RESUMEFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionSuspended(session: CastSession, reason: Int) =
        emit(SessionEventType.SUSPENDED, reason = suspendReason(reason))
    }

  // MARK: - helpers

  private fun emit(
    type: SessionEventType,
    session: SessionInfo? = null,
    error: CastError? = null,
    sessionId: String? = null,
    deviceId: String? = null,
    reason: String? = null,
  ) {
    onLifecycle?.invoke(
      SessionLifecycleEvent(type, session, error, sessionId, deviceId, reason)
    )
  }

  private fun emitDevices() {
    onDevices?.invoke(readDevices())
  }

  private fun readDevices(): Array<Device> {
    val context = NitroModules.applicationContext ?: return emptyArray()
    return MediaRouter.getInstance(context).routes
      .mapNotNull { route -> CastDevice.getFromBundle(route.extras)?.toDevice() }
      .toTypedArray()
  }

  private fun sessionInfo(session: CastSession?, sessionId: String? = null): SessionInfo? {
    if (session == null) return null
    val device = session.castDevice ?: return null
    return SessionInfo(sessionId ?: session.sessionId ?: "", device.toDevice())
  }

  private fun playServicesState(): PlayServicesState {
    val context = NitroModules.applicationContext ?: return PlayServicesState.INVALID
    val code = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context)
    return PlayServicesState.fromGckConnectionResult(code)
  }

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

  private fun mapState(gckState: Int): CastState =
    when (gckState) {
      GckCastState.NO_DEVICES_AVAILABLE -> CastState.NODEVICESAVAILABLE
      GckCastState.NOT_CONNECTED -> CastState.NOTCONNECTED
      GckCastState.CONNECTING -> CastState.CONNECTING
      GckCastState.CONNECTED -> CastState.CONNECTED
      else -> CastState.NOTCONNECTED
    }

  private fun suspendReason(reason: Int): String =
    when (reason) {
      CastStateValues.CAUSE_NETWORK_LOST -> "networkError"
      CastStateValues.CAUSE_SERVICE_DISCONNECTED -> "serviceDisconnected"
      else -> "other"
    }

  private object CastStateValues {
    // GoogleApiClient.ConnectionCallbacks suspend causes.
    const val CAUSE_SERVICE_DISCONNECTED = 1
    const val CAUSE_NETWORK_LOST = 2
  }
}

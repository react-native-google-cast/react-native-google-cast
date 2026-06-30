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
import com.google.android.gms.cast.framework.media.RemoteMediaClient
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.PendingResult
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import com.margelo.nitro.googlecast.converters.CastRejection
import com.margelo.nitro.googlecast.converters.castErrorCodeFromGckStatusCode
import com.margelo.nitro.googlecast.converters.castErrorFromStatusCode
import com.margelo.nitro.googlecast.converters.castRejectionJson
import com.margelo.nitro.googlecast.converters.fromGckConnectionResult
import com.margelo.nitro.googlecast.converters.toDevice
import com.margelo.nitro.googlecast.converters.toGckMediaLoadRequestData
import com.margelo.nitro.googlecast.converters.toGckMediaQueueItem
import com.margelo.nitro.googlecast.converters.toGckMediaSeekOptions
import com.margelo.nitro.googlecast.converters.toGckTextTrackStyle
import com.margelo.nitro.googlecast.converters.toMediaStatus

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
  private var onMediaStatus: ((MediaStatus) -> Unit)? = null

  private var castStateListener: CastStateListener? = null
  private var sessionListener: SessionManagerListener<CastSession>? = null
  private var routerCallback: MediaRouter.Callback? = null
  private var listenersAttached = false

  // The `RemoteMediaClient.Callback` currently registered, plus the exact client it is
  // registered on (so it is removed from the right instance across session changes). Both
  // are touched only on the main thread.
  private var mediaCallback: RemoteMediaClient.Callback? = null
  private var observedClient: RemoteMediaClient? = null

  // In-flight media `PendingResult`s, so teardown can cancel them (and drop our settlement
  // closures). Main-thread only — no extra synchronization needed.
  private val pendingResults = mutableSetOf<PendingResult<RemoteMediaClient.MediaChannelResult>>()

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
    onLifecycle: (event: SessionLifecycleEvent) -> Unit,
    onMediaStatus: (status: MediaStatus) -> Unit
  ): Promise<InitialSnapshot> {
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    this.onMediaStatus = onMediaStatus

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
      val currentSession = castContext.sessionManager.currentCastSession
      // GCK auto-resumes a session early in the process lifecycle — often *before* the JS
      // bundle reaches `initAndSubscribe` — so `onSessionResumed` may have already fired with
      // no media listener attached. Attach to the live client now; the `observedClient` guard
      // keeps this idempotent against a later session callback.
      attachMediaCallback(currentSession?.remoteMediaClient)
      promise.resolve(
        InitialSnapshot(cachedCastState, playServicesState(), readDevices(), sessionInfo(currentSession))
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
      detachMediaCallback()
      // Cancel any in-flight media requests; JS is going away so the promises need not settle.
      pendingResults.forEach { it.cancel() }
      pendingResults.clear()
      onState = null
      onDevices = null
      onLifecycle = null
      onMediaStatus = null
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

  // MARK: - media transport (route to the active session's RemoteMediaClient)
  //
  // Every call re-resolves the current `RemoteMediaClient` on the main thread (Invariant 1 —
  // no cached handle), rejecting with `noSession` when none is active. The returned GCK
  // `PendingResult<MediaChannelResult>` settles the promise exactly once via `mediaCall`.

  override fun loadMedia(request: MediaLoadRequest): Promise<Unit> =
    mediaCall { it.load(request.toGckMediaLoadRequestData()) }

  override fun play(): Promise<Unit> = mediaCall { it.play() }

  override fun pause(): Promise<Unit> = mediaCall { it.pause() }

  override fun stop(): Promise<Unit> = mediaCall { it.stop() }

  override fun seek(options: MediaSeekOptions): Promise<Unit> =
    mediaCall { it.seek(options.toGckMediaSeekOptions()) }

  override fun setPlaybackRate(playbackRate: Double): Promise<Unit> =
    mediaCall { it.setPlaybackRate(playbackRate) }

  override fun setActiveTrackIds(trackIds: DoubleArray): Promise<Unit> =
    mediaCall {
      it.setActiveMediaTracks(LongArray(trackIds.size) { i -> trackIds[i].toIdLong("trackId") })
    }

  override fun setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<Unit> =
    mediaCall { it.setTextTrackStyle(textTrackStyle.toGckTextTrackStyle()) }

  override fun setStreamVolume(volume: Double): Promise<Unit> =
    mediaCall { it.setStreamVolume(volume) }

  override fun setStreamMuted(muted: Boolean): Promise<Unit> =
    mediaCall { it.setStreamMute(muted) }

  override fun queueLoad(
    items: Array<MediaQueueItem>,
    startIndex: Double,
    repeatMode: MediaRepeatMode
  ): Promise<Unit> =
    mediaCall {
      it.queueLoad(
        Array(items.size) { i -> items[i].toGckMediaQueueItem() },
        startIndex.toIdInt("startIndex"),
        gckRepeatMode(repeatMode),
        null
      )
    }

  override fun queueInsertItems(items: Array<MediaQueueItem>, beforeItemId: Double): Promise<Unit> =
    mediaCall {
      it.queueInsertItems(
        Array(items.size) { i -> items[i].toGckMediaQueueItem() },
        beforeItemId.toIdInt("beforeItemId"),
        null
      )
    }

  override fun queueReorderItems(itemIds: DoubleArray, beforeItemId: Double): Promise<Unit> =
    mediaCall {
      it.queueReorderItems(
        IntArray(itemIds.size) { i -> itemIds[i].toIdInt("itemId") },
        beforeItemId.toIdInt("beforeItemId"),
        null
      )
    }

  override fun queueRemoveItems(itemIds: DoubleArray): Promise<Unit> =
    mediaCall {
      it.queueRemoveItems(IntArray(itemIds.size) { i -> itemIds[i].toIdInt("itemId") }, null)
    }

  override fun queueNext(): Promise<Unit> = mediaCall { it.queueNext(null) }

  override fun queuePrev(): Promise<Unit> = mediaCall { it.queuePrev(null) }

  override fun queueJumpToItem(itemId: Double): Promise<Unit> =
    mediaCall { it.queueJumpToItem(itemId.toIdInt("itemId"), null) }

  override fun queueSetRepeatMode(repeatMode: MediaRepeatMode): Promise<Unit> =
    mediaCall { it.queueSetRepeatMode(gckRepeatMode(repeatMode), null) }

  override fun requestMediaStatus(): Promise<Unit> = mediaCall { it.requestStatus() }

  /**
   * Re-resolves the active `RemoteMediaClient` on the main thread, runs [op] to start a GCK
   * media request, and settles the returned promise exactly once from the request's single
   * result callback (status OK → resolve; otherwise reject with a typed `CastError` JSON).
   * Rejects with `noSession` when no session is active, and `failed` if [op] throws
   * synchronously (e.g. an illegal queue argument).
   */
  private fun mediaCall(
    op: (RemoteMediaClient) -> PendingResult<RemoteMediaClient.MediaChannelResult>
  ): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val client = remoteMediaClientOrNull()
      if (client == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      val pending =
        try {
          op(client)
        } catch (e: Exception) {
          promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
          return@runOnMain
        }
      pendingResults.add(pending)
      pending.setResultCallback { result ->
        pendingResults.remove(pending)
        val status = result.status
        if (status.isSuccess) {
          promise.resolve(Unit)
        } else {
          promise.reject(
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
    return promise
  }

  private fun remoteMediaClientOrNull(): RemoteMediaClient? =
    sharedCastContextOrNull()?.sessionManager?.currentCastSession?.remoteMediaClient

  /** Register the media-status listener on [client], replacing any previous registration. */
  private fun attachMediaCallback(client: RemoteMediaClient?) {
    if (client == null || observedClient === client) return
    detachMediaCallback()
    val callback =
      object : RemoteMediaClient.Callback() {
        override fun onStatusUpdated() = emitMediaStatus(client)
        // Queue-only mutations (queueInsertItems / queueReorderItems / queueRemoveItems and
        // receiver-side queue edits) report via onQueueStatusUpdated, *not* onStatusUpdated —
        // forward them through the same path so the cached status' queueItems never goes stale
        // until an unrelated player-status update happens to arrive.
        override fun onQueueStatusUpdated() = emitMediaStatus(client)
      }
    client.registerCallback(callback)
    mediaCallback = callback
    observedClient = client
    // Surface the current status immediately so the store reflects an already-playing session.
    emitMediaStatus(client)
  }

  private fun emitMediaStatus(client: RemoteMediaClient) {
    client.mediaStatus?.let { status -> onMediaStatus?.invoke(status.toMediaStatus()) }
  }

  private fun detachMediaCallback() {
    val callback = mediaCallback ?: return
    observedClient?.unregisterCallback(callback)
    mediaCallback = null
    observedClient = null
  }

  // Queue/track IDs and indices cross the bridge as `Double`. A bare `toInt()` / `toLong()`
  // silently narrows NaN, ±Inf, fractional, and out-of-range values — quietly targeting the
  // *wrong* item — so validate before converting. Thrown from inside a `mediaCall` op lambda,
  // these surface to JS as a `failed` rejection (see `mediaCall`). Note: `0`/negatives are left
  // to GCK, which uses `MediaQueueItem.INVALID_ITEM_ID == 0` as the "append at end" sentinel.
  private fun Double.toIdInt(name: String): Int {
    require(isFinite() && this % 1.0 == 0.0 && this >= Int.MIN_VALUE.toDouble() && this <= Int.MAX_VALUE.toDouble()) {
      "$name must be a finite integer in Int range, got $this"
    }
    return toInt()
  }

  private fun Double.toIdLong(name: String): Long {
    require(isFinite() && this % 1.0 == 0.0 && this >= Long.MIN_VALUE.toDouble() && this <= Long.MAX_VALUE.toDouble()) {
      "$name must be a finite integer in Long range, got $this"
    }
    return toLong()
  }

  private fun gckRepeatMode(mode: MediaRepeatMode): Int =
    when (mode) {
      MediaRepeatMode.OFF -> com.google.android.gms.cast.MediaStatus.REPEAT_MODE_REPEAT_OFF
      MediaRepeatMode.ALL -> com.google.android.gms.cast.MediaStatus.REPEAT_MODE_REPEAT_ALL
      MediaRepeatMode.SINGLE -> com.google.android.gms.cast.MediaStatus.REPEAT_MODE_REPEAT_SINGLE
      MediaRepeatMode.ALLANDSHUFFLE ->
        com.google.android.gms.cast.MediaStatus.REPEAT_MODE_REPEAT_ALL_AND_SHUFFLE
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
      override fun onSessionStarted(session: CastSession, sessionId: String) {
        attachMediaCallback(session.remoteMediaClient)
        emit(SessionEventType.STARTED, session = sessionInfo(session, sessionId))
      }
      override fun onSessionStartFailed(session: CastSession, error: Int) =
        emit(SessionEventType.STARTFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionEnding(session: CastSession) =
        emit(SessionEventType.ENDING, session = sessionInfo(session))
      override fun onSessionEnded(session: CastSession, error: Int) {
        detachMediaCallback()
        emit(
          SessionEventType.ENDED,
          error = if (error != 0) castErrorFromStatusCode(error, null) else null
        )
      }
      override fun onSessionResuming(session: CastSession, sessionId: String) =
        emit(SessionEventType.RESUMING, sessionId = sessionId)
      override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) {
        attachMediaCallback(session.remoteMediaClient)
        emit(SessionEventType.RESUMED, session = sessionInfo(session))
      }
      override fun onSessionResumeFailed(session: CastSession, error: Int) =
        emit(SessionEventType.RESUMEFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionSuspended(session: CastSession, reason: Int) {
        detachMediaCallback()
        emit(SessionEventType.SUSPENDED, reason = suspendReason(reason))
      }
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

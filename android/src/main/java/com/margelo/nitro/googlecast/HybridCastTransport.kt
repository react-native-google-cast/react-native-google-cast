package com.margelo.nitro.googlecast

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.fragment.app.FragmentActivity
import androidx.mediarouter.app.MediaRouteChooserDialogFragment
import androidx.mediarouter.app.MediaRouteControllerDialogFragment
import androidx.mediarouter.media.MediaRouter
import com.google.android.gms.cast.Cast
import com.google.android.gms.cast.CastDevice
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.CastSession
import com.google.android.gms.cast.framework.CastState as GckCastState
import com.google.android.gms.cast.framework.CastStateListener
import com.google.android.gms.cast.framework.IntroductoryOverlay
import com.google.android.gms.cast.framework.SessionManagerListener
import com.google.android.gms.cast.framework.media.RemoteMediaClient
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.PendingResult
import com.google.android.gms.common.api.Status
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.AnyMap
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
import com.margelo.nitro.googlecast.converters.toJsonObject
import com.margelo.nitro.googlecast.converters.toMediaStatus
import com.margelo.nitro.googlecast.converters.toSessionInfo

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
  private var onChannelMessage: ((String, String) -> Unit)? = null
  private var onChannelStatus: ((String, Boolean, Boolean) -> Unit)? = null

  // Registered custom channels by namespace (Phase 5.2). Cleared explicitly on
  // session end/suspend and on dispose (A1) so a dead session's callbacks never
  // leak into the next one (a replace is covered too: GCK always ends the old
  // session before starting its replacement). Main thread only.
  private val channels = mutableMapOf<String, Cast.MessageReceivedCallback>()

  // In-flight sendMessage results, so dispose can cancel them (mirrors
  // `pendingResults`; sendMessage returns PendingResult<Status>, not
  // MediaChannelResult, hence the separate set).
  private val pendingChannelResults = mutableSetOf<PendingResult<Status>>()

  private var castStateListener: CastStateListener? = null
  private var sessionListener: SessionManagerListener<CastSession>? = null
  private var routerCallback: MediaRouter.Callback? = null
  private var listenersAttached = false

  // The `RemoteMediaClient.Callback` currently registered, plus the exact client it is
  // registered on (so it is removed from the right instance across session changes). Both
  // are touched only on the main thread.
  private var mediaCallback: RemoteMediaClient.Callback? = null
  private var observedClient: RemoteMediaClient? = null

  // The `Cast.Listener` currently registered for device-detail changes (volume/mute,
  // application metadata/status, standby, active-input), plus the exact session it is
  // registered on (so it is removed from the right instance across session changes). Both
  // are touched only on the main thread — mirrors the media-callback discipline above.
  private var castListener: Cast.Listener? = null
  private var observedCastSession: CastSession? = null

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
    onMediaStatus: (status: MediaStatus) -> Unit,
    onChannelMessage: (namespace: String, message: String) -> Unit,
    onChannelStatus: (namespace: String, connected: Boolean, writable: Boolean) -> Unit
  ): Promise<InitialSnapshot> {
    this.onState = onState
    this.onDevices = onDevices
    this.onLifecycle = onLifecycle
    this.onMediaStatus = onMediaStatus
    this.onChannelMessage = onChannelMessage
    this.onChannelStatus = onChannelStatus

    // Debug-only fake seam (T3): expose the freshly stored callbacks to
    // `HybridCastDebug.inject*`. Gating (host-app debuggable) lives in the sink;
    // the closures read the current fields, so `dispose()` also silences the seam.
    CastDebugEventSink.attach(
      CastDebugEventSink.Emitters(
        emitState = { this.onState?.invoke(it) },
        emitDevices = { this.onDevices?.invoke(it) },
        emitLifecycle = { this.onLifecycle?.invoke(it) },
        emitMediaStatus = { this.onMediaStatus?.invoke(it) },
      )
    )

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
      attachCastListener(currentSession)
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
    CastDebugEventSink.detach()
    runOnMain {
      detachObservers()
      detachMediaCallback()
      detachCastListener()
      clearChannels(sharedCastContextOrNull()?.sessionManager?.currentCastSession)
      // Cancel any in-flight media requests; JS is going away so the promises need not settle.
      pendingResults.forEach { it.cancel() }
      pendingResults.clear()
      pendingChannelResults.forEach { it.cancel() }
      pendingChannelResults.clear()
      onState = null
      onDevices = null
      onLifecycle = null
      onMediaStatus = null
      onChannelMessage = null
      onChannelStatus = null
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

  // MARK: - device-level volume/mute (act on the CastSession, not the media stream)

  override fun setDeviceVolume(volume: Double): Promise<Unit> = sessionCall { it.setVolume(volume) }

  override fun setDeviceMuted(muted: Boolean): Promise<Unit> = sessionCall { it.setMute(muted) }

  /**
   * Re-resolves the active [CastSession] on the main thread (Invariant 1 — no cached handle),
   * runs the `void`/throwing setter [op], and settles the promise. Rejects with `noSession`
   * when none is active, and `failed` (+ the exception message) if [op] throws — `CastSession`
   * setters throw `IOException` / `IllegalStateException`, both `Exception` subtypes.
   *
   * This is the session-level analogue of [mediaCall], which cannot be reused: media requests
   * return a `PendingResult` that settles asynchronously, whereas these setters return `void`
   * and signal failure only by throwing synchronously.
   */
  private fun sessionCall(op: (CastSession) -> Unit): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
      if (session == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      try {
        op(session)
        promise.resolve(Unit)
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }

  // MARK: - custom channels (Phase 5.2 — registry owned here, Invariant 1 for the session)

  // The parameter is named `channelNamespace` (matching the generated spec,
  // where `namespace` is a C++ keyword); `namespace` stays the local term.
  override fun addChannel(channelNamespace: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
      if (session == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      if (channels.containsKey(channelNamespace)) {
        promise.reject(
          CastRejection(
            castRejectionJson(
              "alreadyRegistered", "A channel for $channelNamespace is already registered.", null
            )
          )
        )
        return@runOnMain
      }
      val callback = Cast.MessageReceivedCallback { _, ns, message ->
        onChannelMessage?.invoke(ns, message)
      }
      try {
        session.setMessageReceivedCallbacks(channelNamespace, callback)
      } catch (e: Exception) {
        // setMessageReceivedCallbacks throws IOException / IllegalStateException.
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
        return@runOnMain
      }
      channels[channelNamespace] = callback
      // Register-once status (v4 parity, A2): the Android SDK has no
      // per-channel connect/writable callbacks, so {true, true} is emitted
      // exactly once at registration and never updated — emitted BEFORE
      // resolving so an awaiting façade reads a populated value.
      onChannelStatus?.invoke(channelNamespace, true, true)
      promise.resolve(Unit)
    }
    return promise
  }

  override fun removeChannel(channelNamespace: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      if (channels.remove(channelNamespace) != null) {
        // Best-effort: the session may already be gone (its callbacks died
        // with it); unregistering from a live one keeps GCK in sync.
        try {
          sharedCastContextOrNull()?.sessionManager?.currentCastSession
            ?.removeMessageReceivedCallbacks(channelNamespace)
        } catch (_: Exception) {}
      }
      promise.resolve(Unit) // idempotent — not-registered resolves
    }
    return promise
  }

  override fun sendMessage(channelNamespace: String, message: String): Promise<Unit> {
    val promise = Promise<Unit>()
    runOnMain {
      val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
      if (session == null) {
        promise.reject(
          CastRejection(castRejectionJson("noSession", "No active Cast session.", null))
        )
        return@runOnMain
      }
      if (!channels.containsKey(channelNamespace)) {
        promise.reject(
          CastRejection(
            castRejectionJson(
              "invalidRequest",
              "No channel registered for $channelNamespace — call addChannel first.",
              null
            )
          )
        )
        return@runOnMain
      }
      val pending =
        try {
          session.sendMessage(channelNamespace, message)
        } catch (e: Exception) {
          promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
          return@runOnMain
        }
      // A2-minor: await the PendingResult — never fire-and-forget a send.
      pendingChannelResults.add(pending)
      pending.setResultCallback { result ->
        pendingChannelResults.remove(pending)
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

  // MARK: - Cast UI (Phase 6.1 — imperative one-shots; main thread, Invariant 1)
  //
  // The boolean means "the present/launch call was issued" (E7); the graceful
  // can't-show cases (no Cast framework, no/finishing Activity, no visible
  // button anchor, overlay already shown once) resolve `false`. Only genuine
  // native failures reject a typed CastError.

  override fun showCastDialog(): Promise<Boolean> {
    val promise = Promise<Boolean>()
    runOnMain {
      val castContext = sharedCastContextOrNull()
      // The MediaRoute*DialogFragment forms are lifecycle-managed by the
      // FragmentManager (ReactActivity is a FragmentActivity), so a rotation
      // cannot leak the dialog window like the raw dialogs would (E9).
      val activity = currentActivityOrNull() as? FragmentActivity
      if (castContext == null || activity == null) {
        promise.resolve(false)
        return@runOnMain
      }
      val fragmentManager = activity.supportFragmentManager
      // After onSaveInstanceState (backgrounding race) `show()` would throw an
      // IllegalStateException — that's a can't-show-right-now, not a failure.
      if (fragmentManager.isStateSaved) {
        promise.resolve(false)
        return@runOnMain
      }
      // A dialog is already up (rapid repeated calls): it is shown — done.
      if (
        fragmentManager.findFragmentByTag(CHOOSER_DIALOG_TAG) != null ||
        fragmentManager.findFragmentByTag(CONTROLLER_DIALOG_TAG) != null
      ) {
        promise.resolve(true)
        return@runOnMain
      }
      try {
        if (castContext.sessionManager.currentCastSession != null) {
          // A session exists (`connecting` included, matching what a
          // MediaRouteButton would present) → in-session controller dialog.
          MediaRouteControllerDialogFragment()
            .show(fragmentManager, CONTROLLER_DIALOG_TAG)
        } else {
          val selector = castContext.mergedSelector
          if (selector == null) {
            promise.resolve(false)
            return@runOnMain
          }
          val fragment = MediaRouteChooserDialogFragment()
          fragment.routeSelector = selector
          fragment.show(fragmentManager, CHOOSER_DIALOG_TAG)
        }
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }

  override fun showExpandedControls(): Promise<Boolean> {
    val promise = Promise<Boolean>()
    runOnMain {
      val activity = currentActivityOrNull()
      // Gate on the framework too: GCK's ExpandedControllerActivity resolves
      // CastContext in its own onCreate, so launching without a working Cast
      // framework would crash the *launched* activity after we resolved.
      if (activity == null || sharedCastContextOrNull() == null) {
        promise.resolve(false)
        return@runOnMain
      }
      val intent = Intent(activity, NitroExpandedControllerActivity::class.java)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        activity.startActivity(intent)
        promise.resolve(true)
      } catch (e: ActivityNotFoundException) {
        // Defensive fallback (E8/1A): the activity is pre-registered by this
        // library's manifest since 6.2, so a healthy install can't get here —
        // stay loud with a diagnosis instead of a stale how-to-register.
        promise.reject(
          CastRejection(
            castRejectionJson(
              "notSupported",
              "NitroExpandedControllerActivity could not be launched even though it is " +
                "pre-registered via the react-native-google-cast library manifest. This " +
                "means the manifest merge was overridden (e.g. a stale manual <activity> " +
                "declaration removed it via tools:node=\"remove\") or Google Play " +
                "Services / the Cast framework is unavailable — check the merged " +
                "AndroidManifest.xml and getPlayServicesState().",
              null
            )
          )
        )
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }

  override fun showIntroductoryOverlay(once: Boolean): Promise<Boolean> {
    val promise = Promise<Boolean>()
    runOnMain {
      val context = NitroModules.applicationContext
      if (context == null) {
        promise.resolve(false)
        return@runOnMain
      }
      // Own once-flag (E2): GCK's `IntroductoryOverlay.setSingleTime()` makes
      // `show()` a silent no-op when the overlay was ever shown before and the
      // dismiss listener never fires — one of the two v4 promise hangs. It is
      // therefore never used; this SharedPreferences flag is the only "once"
      // bookkeeping, and every path below settles the promise.
      val prefs = context.getSharedPreferences(OVERLAY_PREFS, Context.MODE_PRIVATE)
      if (once && prefs.getBoolean(OVERLAY_SHOWN_KEY, false)) {
        promise.resolve(false)
        return@runOnMain
      }
      val activity = currentActivityOrNull()
      val button = CastButtonRegistry.current
      if (activity == null || button == null) {
        // No Activity or no attached+visible CastButton anchor: resolve
        // `false` instead of hanging forever (the other v4 hang).
        promise.resolve(false)
        return@runOnMain
      }
      try {
        IntroductoryOverlay.Builder(activity, button)
          // A user-interaction callback, NOT a lifecycle one: it never fires
          // when the Activity dies with the overlay up, so the promise must
          // not wait for it — it only records the once-flag (E2). An
          // undismissed overlay therefore also re-shows next launch.
          .setOnOverlayDismissedListener {
            prefs.edit().putBoolean(OVERLAY_SHOWN_KEY, true).apply()
          }
          .build()
          .show()
        // Settle at presentation (matches iOS and the other show* methods).
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }

  // MARK: - Cast setup / diagnostics UI (Phase 6.2)

  /**
   * Present the Play Services error-resolution dialog for a ConnectionResult
   * `errorCode` (contract ii, v4 parity). `true` is GoogleApiAvailability's
   * own shown-boolean; the graceful can't-show cases resolve `false` — no
   * current Activity, or a code needing no dialog (`success`, for which the
   * SDK documents a null dialog). Only genuine native throws reject.
   */
  override fun showPlayServicesErrorDialog(errorCode: Double): Promise<Boolean> {
    val promise = Promise<Boolean>()
    runOnMain {
      val activity = currentActivityOrNull()
      if (activity == null) {
        promise.resolve(false)
        return@runOnMain
      }
      try {
        val shown = GoogleApiAvailability.getInstance()
          .showErrorDialogFragment(activity, errorCode.toInt(), 0)
        promise.resolve(shown)
      } catch (e: Exception) {
        promise.reject(CastRejection(castRejectionJson("failed", e.message, null)))
      }
    }
    return promise
  }

  /**
   * The foreground Activity, re-resolved per call (Invariant 1 — never cached);
   * `null` when there is none or it is already finishing/destroyed.
   */
  private fun currentActivityOrNull(): Activity? {
    val activity = NitroModules.applicationContext?.currentActivity ?: return null
    if (activity.isFinishing || activity.isDestroyed) return null
    return activity
  }

  // MARK: - media transport (route to the active session's RemoteMediaClient)
  //
  // Every call re-resolves the current `RemoteMediaClient` on the main thread (Invariant 1 —
  // no cached handle), rejecting with `noSession` when none is active. The returned GCK
  // `PendingResult<MediaChannelResult>` settles the promise exactly once via `mediaCall`.

  override fun loadMedia(request: MediaLoadRequest): Promise<Unit> =
    mediaCall { it.load(request.toGckMediaLoadRequestData()) }

  // `customData` (v5-aug.5): forwarded as the GCK `JSONObject` parameter where
  // the SDK accepts one (verified against the 22.0.0 AAR); `null` matches the
  // previous behaviour exactly.

  override fun play(customData: AnyMap?): Promise<Unit> =
    mediaCall { it.play(customData?.toJsonObject()) }

  override fun pause(customData: AnyMap?): Promise<Unit> =
    mediaCall { it.pause(customData?.toJsonObject()) }

  override fun stop(customData: AnyMap?): Promise<Unit> =
    mediaCall { it.stop(customData?.toJsonObject()) }

  override fun seek(options: MediaSeekOptions): Promise<Unit> =
    mediaCall { it.seek(options.toGckMediaSeekOptions()) }

  override fun setPlaybackRate(playbackRate: Double, customData: AnyMap?): Promise<Unit> =
    mediaCall { it.setPlaybackRate(playbackRate, customData?.toJsonObject()) }

  override fun setActiveTrackIds(trackIds: DoubleArray): Promise<Unit> =
    mediaCall {
      it.setActiveMediaTracks(LongArray(trackIds.size) { i -> trackIds[i].toIdLong("trackId") })
    }

  override fun setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<Unit> =
    mediaCall { it.setTextTrackStyle(textTrackStyle.toGckTextTrackStyle()) }

  override fun setStreamVolume(volume: Double, customData: AnyMap?): Promise<Unit> =
    mediaCall { it.setStreamVolume(volume, customData?.toJsonObject()) }

  override fun setStreamMuted(muted: Boolean, customData: AnyMap?): Promise<Unit> =
    mediaCall { it.setStreamMute(muted, customData?.toJsonObject()) }

  override fun queueLoad(
    items: Array<MediaQueueItem>,
    startIndex: Double,
    repeatMode: MediaRepeatMode,
    customData: AnyMap?
  ): Promise<Unit> =
    mediaCall {
      it.queueLoad(
        Array(items.size) { i -> items[i].toGckMediaQueueItem() },
        startIndex.toIdInt("startIndex"),
        gckRepeatMode(repeatMode),
        customData?.toJsonObject()
      )
    }

  override fun queueInsertItems(
    items: Array<MediaQueueItem>,
    beforeItemId: Double,
    customData: AnyMap?
  ): Promise<Unit> =
    mediaCall {
      it.queueInsertItems(
        Array(items.size) { i -> items[i].toGckMediaQueueItem() },
        beforeItemId.toIdInt("beforeItemId"),
        customData?.toJsonObject()
      )
    }

  override fun queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId: Double,
    playPosition: Double?,
    customData: AnyMap?
  ): Promise<Unit> =
    mediaCall {
      val gckItem = item.toGckMediaQueueItem()
      val before = beforeItemId.toIdInt("beforeItemId")
      val json = customData?.toJsonObject()
      if (playPosition != null) {
        // Seconds (TS) → milliseconds (GCK Android), same as the seek converter.
        it.queueInsertAndPlayItem(gckItem, before, playPosition.toPlayPositionMs(), json)
      } else {
        // No explicit position — the item's startTime governs its first play.
        it.queueInsertAndPlayItem(gckItem, before, json)
      }
    }

  override fun queueReorderItems(
    itemIds: DoubleArray,
    beforeItemId: Double,
    customData: AnyMap?
  ): Promise<Unit> =
    mediaCall {
      it.queueReorderItems(
        IntArray(itemIds.size) { i -> itemIds[i].toIdInt("itemId") },
        beforeItemId.toIdInt("beforeItemId"),
        customData?.toJsonObject()
      )
    }

  override fun queueRemoveItems(itemIds: DoubleArray, customData: AnyMap?): Promise<Unit> =
    mediaCall {
      it.queueRemoveItems(
        IntArray(itemIds.size) { i -> itemIds[i].toIdInt("itemId") },
        customData?.toJsonObject()
      )
    }

  override fun queueNext(customData: AnyMap?): Promise<Unit> =
    mediaCall { it.queueNext(customData?.toJsonObject()) }

  override fun queuePrev(customData: AnyMap?): Promise<Unit> =
    mediaCall { it.queuePrev(customData?.toJsonObject()) }

  override fun queueJumpToItem(itemId: Double, customData: AnyMap?): Promise<Unit> =
    mediaCall { it.queueJumpToItem(itemId.toIdInt("itemId"), customData?.toJsonObject()) }

  override fun queueSetRepeatMode(repeatMode: MediaRepeatMode, customData: AnyMap?): Promise<Unit> =
    mediaCall { it.queueSetRepeatMode(gckRepeatMode(repeatMode), customData?.toJsonObject()) }

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
    client.mediaStatus?.let { status ->
      refreshNotificationActionsIfNeeded(status)
      onMediaStatus?.invoke(status.toMediaStatus())
    }
  }

  /**
   * The default notification actions come from a [NotificationActionsProvider]
   * whose output depends on the queue size and media type — GCK only re-queries
   * the provider when the notification is rebuilt, so a session that starts with
   * a single video and later loads a queue (or a photo) would keep the stale
   * button set. Per the official provider-actions guidance, nudge
   * `MediaNotificationManager.updateNotification()` when (and only when) the
   * action-determining inputs flip. Main thread (all media callbacks are).
   */
  private var lastNotificationActionsKey: Pair<Boolean, Boolean>? = null

  private fun refreshNotificationActionsIfNeeded(
    status: com.google.android.gms.cast.MediaStatus
  ) {
    val key =
      Pair(
        status.queueItemCount > 1,
        status.mediaInfo?.metadata?.mediaType ==
          com.google.android.gms.cast.MediaMetadata.MEDIA_TYPE_PHOTO
      )
    if (key == lastNotificationActionsKey) return
    val isFirst = lastNotificationActionsKey == null
    lastNotificationActionsKey = key
    // First status of a session establishes the baseline the notification was
    // built with — nothing to refresh yet.
    if (isFirst) return
    try {
      sharedCastContextOrNull()?.mediaNotificationManager?.updateNotification()
    } catch (e: Exception) {
      // Notification refresh is best-effort; never let it break status flow.
    }
  }

  private fun detachMediaCallback() {
    val callback = mediaCallback ?: return
    observedClient?.unregisterCallback(callback)
    mediaCallback = null
    observedClient = null
    // Next session re-baselines the notification-actions key (its first status
    // is what the fresh notification is built from).
    lastNotificationActionsKey = null
  }

  /**
   * Register the device-detail listener on [session], replacing any previous registration.
   * Each callback re-reads a fresh `SessionInfo` and emits the matching lifecycle event so the
   * store's device detail (volume/mute, app metadata/status, standby, active-input) stays live.
   * Mirrors [attachMediaCallback]: nullable session + `observedCastSession` idempotency guard.
   */
  private fun attachCastListener(session: CastSession?) {
    if (session == null || observedCastSession === session) return
    detachCastListener()
    val listener =
      object : Cast.Listener() {
        override fun onVolumeChanged() = emitDetail(SessionEventType.DEVICESTATUSCHANGED)
        override fun onApplicationStatusChanged() = emitDetail(SessionEventType.DEVICESTATUSCHANGED)
        // Receiver rename: refresh `SessionInfo.device.friendlyName` (emitDetail re-reads a
        // fresh SessionInfo, which rebuilds `device` from the current CastDevice).
        override fun onDeviceNameChanged() = emitDetail(SessionEventType.DEVICESTATUSCHANGED)
        // Fully-qualified param type: a bare `ApplicationMetadata` binds to the same-package Nitro
        // struct and would silently fail to override the GCK callback.
        override fun onApplicationMetadataChanged(
          applicationMetadata: com.google.android.gms.cast.ApplicationMetadata?
        ) = emitDetail(SessionEventType.DEVICESTATUSCHANGED)
        override fun onStandbyStateChanged(standbyState: Int) =
          emitDetail(SessionEventType.STANDBYSTATECHANGED)
        override fun onActiveInputStateChanged(activeInputState: Int) =
          emitDetail(SessionEventType.ACTIVEINPUTSTATECHANGED)
      }
    session.addCastListener(listener)
    castListener = listener
    observedCastSession = session
  }

  private fun detachCastListener() {
    val listener = castListener ?: return
    observedCastSession?.removeCastListener(listener)
    castListener = null
    observedCastSession = null
  }

  /**
   * Drop every registered custom channel (A1). Called on session end/suspend
   * (with the callback's still-valid session handle, so the GCK-side
   * unregistration succeeds) and on dispose. The app re-adds channels on the
   * next session, per the guide.
   */
  private fun clearChannels(session: CastSession?) {
    if (channels.isEmpty()) return
    channels.keys.forEach { namespace ->
      try {
        session?.removeMessageReceivedCallbacks(namespace)
      } catch (_: Exception) {}
    }
    channels.clear()
  }

  /**
   * Emits [type] carrying a fresh full [SessionInfo] read from the *current* session (Invariant 1
   * — re-resolved, not the closed-over handle from `attachCastListener`). A teardown race that
   * nulls the session emits a null `sessionInfo`, consistent with how `ENDED` already emits null.
   */
  private fun emitDetail(type: SessionEventType) {
    val session = sharedCastContextOrNull()?.sessionManager?.currentCastSession
    emit(type, session = sessionInfo(session))
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

  // `playPosition` seconds → GCK milliseconds. Same silent-narrowing hazard as the ID
  // converters above (`(NaN).toLong() == 0`, `(+Inf).toLong() == Long.MAX_VALUE` — a garbage
  // value would become a *real* start position), so validate: finite, non-negative, and small
  // enough that the ms conversion stays in Long range. Fractional seconds are fine (it is a
  // time, not an id). Thrown inside a `mediaCall` op lambda → JS sees a `failed` rejection.
  private fun Double.toPlayPositionMs(): Long {
    require(isFinite() && this >= 0.0 && this <= Long.MAX_VALUE.toDouble() / 1000.0) {
      "playPosition must be a finite non-negative number of seconds, got $this"
    }
    return (this * 1000).toLong()
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
        attachCastListener(session)
        emit(SessionEventType.STARTED, session = sessionInfo(session, sessionId))
      }
      override fun onSessionStartFailed(session: CastSession, error: Int) =
        emit(SessionEventType.STARTFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionEnding(session: CastSession) =
        emit(SessionEventType.ENDING, session = sessionInfo(session))
      override fun onSessionEnded(session: CastSession, error: Int) {
        detachMediaCallback()
        detachCastListener()
        clearChannels(session)
        emit(
          SessionEventType.ENDED,
          error = if (error != 0) castErrorFromStatusCode(error, null) else null
        )
      }
      override fun onSessionResuming(session: CastSession, sessionId: String) =
        emit(SessionEventType.RESUMING, sessionId = sessionId)
      override fun onSessionResumed(session: CastSession, wasSuspended: Boolean) {
        attachMediaCallback(session.remoteMediaClient)
        attachCastListener(session)
        emit(SessionEventType.RESUMED, session = sessionInfo(session))
      }
      override fun onSessionResumeFailed(session: CastSession, error: Int) =
        emit(SessionEventType.RESUMEFAILED, error = castErrorFromStatusCode(error, null))
      override fun onSessionSuspended(session: CastSession, reason: Int) {
        detachMediaCallback()
        detachCastListener()
        clearChannels(session)
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

  private fun sessionInfo(session: CastSession?, sessionId: String? = null): SessionInfo? =
    session?.toSessionInfo(sessionId)

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

  private companion object {
    // FragmentManager tags for the Cast UI dialogs (E9).
    const val CHOOSER_DIALOG_TAG = "NitroGoogleCastChooserDialog"
    const val CONTROLLER_DIALOG_TAG = "NitroGoogleCastControllerDialog"

    // Our own introductory-overlay once-flag (E2 — GCK's `setSingleTime` is
    // never used because it silently swallows the dismiss callback). Note the
    // iOS flag is GCK's own and lives in a different store; the two are
    // independent (documented in the guide).
    const val OVERLAY_PREFS = "nitro_googlecast"
    const val OVERLAY_SHOWN_KEY = "nitro_googlecast_intro_overlay_shown"
  }
}

import Foundation
import GoogleCast
import NitroModules

/// Nitro implementation of the singleton Cast transport (iOS), backed by the
/// Google Cast SDK (GCK).
///
/// Design (see plan: "thin Nitro bridge + fat TypeScript"):
/// - The ONLY stateful native object. It holds the GCK listener registries and a
///   cached read-state; the TS `CastStore` is its only long-lived subscriber and
///   serves all public reads synchronously from its own cache.
/// - **All GCK access is on the main thread** (GCK is main-thread-only).
/// - **Invariant 1 (no cached handle for operations):** every mutation re-resolves
///   the current session/device from the GCK singletons on the main thread per
///   call — nothing here caches a `GCKSession`/`GCKCastSession` handle for later
///   use, so there is no stale handle to crash on after disconnect.
/// - `initAndSubscribe` attaches the cast-state / discovery / session-manager
///   observers AND returns the initial snapshot in the same main-thread turn,
///   closing the init race a plain async `addListener` cannot.
///
/// The GCK listener protocols require an `NSObject`, which the Nitro base is not,
/// so the discovery / session listeners are small `NSObject` adapters
/// (`CastDiscoveryListener` / `CastSessionListener`) that forward to closures.
///
/// DEVICE-GATED (Phase 3 spike, verified on simulator/device): real GCK event
/// delivery, error `code`+`nativeCode` across the bridge, clean teardown, and the
/// exact bridged selector names of the *optional* `GCKSessionManagerListener`
/// methods below (a wrong Swift name compiles but silently never fires).
final class HybridCastTransport: HybridCastTransportSpec {
  private var onState: ((CastState) -> Void)?
  private var onDevices: (([Device]) -> Void)?
  private var onLifecycle: ((SessionLifecycleEvent) -> Void)?
  private var onMediaStatus: ((MediaStatus) -> Void)?
  private var onChannelMessage: ((String, String) -> Void)?
  private var onChannelStatus: ((String, Bool, Bool) -> Void)?
  // Registered custom channels by namespace (Phase 5.2). The transport owns the
  // single strong reference per channel; cleared explicitly on session
  // end/suspend and on dispose (A1), so a dead session's channels can never
  // leak into the next one (a replace is covered too: GCK always ends the old
  // session before starting its replacement). Main thread only.
  private var channels: [String: CastMessageChannel] = [:]

  private var castStateObserver: NSObjectProtocol?
  private var discoveryListener: CastDiscoveryListener?
  private var sessionListener: CastSessionListener?
  private var listenersAttached = false

  // Media transport state (all touched on the main thread only — see Invariant 1).
  // `mediaStatusListener` is the single strong owner of the GCK media-status
  // adapter (GCK holds it weakly); `attachedMediaClient` tracks which client it is
  // currently bound to so re-resolution across sessions never double-attaches.
  // `pendingRequests` retains every in-flight `CastRequestDelegate` until it
  // settles, so disconnect/teardown can reject the stragglers (T6).
  private var mediaStatusListener: CastRemoteMediaClientListener?
  private weak var attachedMediaClient: GCKRemoteMediaClient?
  private var pendingRequests: Set<CastRequestDelegate> = []

  // Device-status (standby / active-input) transport state — same ownership model
  // as the media listener above. `deviceStatusListener` is the single strong
  // owner of the GCK adapter (GCK holds it weakly); `attachedStatusSession` tracks
  // which cast session it is bound to so re-resolution never double-attaches.
  private var deviceStatusListener: CastDeviceStatusListener?
  private weak var attachedStatusSession: GCKCastSession?

  // Main-thread-only cache (written and read exclusively inside main-queue hops).
  private var cachedCastState: CastState = .notconnected
  // Cross-thread cached flags: written on the main thread inside the GCK hops,
  // read synchronously from the JS thread by the `is*` accessors below — so they
  // are lock-boxed (the Swift analogue of the Android transport's `@Volatile`).
  private let cachedDiscovering = AtomicFlag(false)
  private let cachedPassiveScan = AtomicFlag(false)

  override init() { super.init() }

  // iOS has no Play-Services gating; casting is available once GCKCastContext is
  // configured at launch (the v5 SDK-init step).
  var isAvailable: Bool { true }
  var isDiscovering: Bool { cachedDiscovering.load() }
  var isPassiveScan: Bool { cachedPassiveScan.load() }

  // MARK: - init + subscribe (atomic, main thread)

  func initAndSubscribe(
    onState: @escaping (_ castState: CastState) -> Void,
    onDevices: @escaping (_ devices: [Device]) -> Void,
    onLifecycle: @escaping (_ event: SessionLifecycleEvent) -> Void,
    onMediaStatus: @escaping (_ status: MediaStatus) -> Void,
    onChannelMessage: @escaping (_ channelNamespace: String, _ message: String) -> Void,
    onChannelStatus: @escaping (_ channelNamespace: String, _ connected: Bool, _ writable: Bool) ->
      Void
  ) throws -> Promise<InitialSnapshot> {
    self.onState = onState
    self.onDevices = onDevices
    self.onLifecycle = onLifecycle
    self.onMediaStatus = onMediaStatus
    self.onChannelMessage = onChannelMessage
    self.onChannelStatus = onChannelStatus

    // Debug-only fake seam (T3): expose the freshly stored callbacks to
    // `HybridCastDebug.inject*`. Gating (`#if DEBUG`) lives in the sink; the
    // closures read the current vars, so `dispose()` also silences the seam.
    CastDebugEventSink.attach(
      emitState: { [weak self] in self?.onState?($0) },
      emitDevices: { [weak self] in self?.onDevices?($0) },
      emitLifecycle: { [weak self] in self?.onLifecycle?($0) },
      emitMediaStatus: { [weak self] in self?.onMediaStatus?($0) })

    let promise = Promise<InitialSnapshot>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        // Disposed before this block ran — settle so the caller never hangs.
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      let context = GCKCastContext.sharedInstance()
      // Default image picker (contract i): one owner, one assignment point,
      // never clobbering a consumer-set picker (AppDelegate runs before us).
      if let picker = NitroImagePicker.installIfAbsent(current: context.imagePicker) {
        context.imagePicker = picker
      }
      self.attachObservers(context)
      // If a session was already current before we subscribed, bind the media
      // and device-status listeners now so updates flow without waiting for the
      // next start.
      self.attachMediaListener()
      self.attachDeviceStatusListener()

      self.cachedCastState = Self.mapState(context.castState)
      self.cachedPassiveScan.store(context.discoveryManager.passiveScan)
      // Seed from GCK's readable flag (v5-xr6): with the default first-tap
      // gate the manager is idle here (false), but a host app that opted into
      // launch-time autostart already has discovery running. Later
      // SDK-initiated starts are caught by the discovery listener's
      // `didStartDiscovery(forDeviceCategory:)` (see `attachObservers`).
      self.cachedDiscovering.store(context.discoveryManager.discoveryActive)
      let devices = self.readDevices(context.discoveryManager)
      let currentCastSession = context.sessionManager.currentCastSession
      let current = Self.sessionInfo(currentCastSession)
      // Cold-start media status (v5-az2): a session live before JS init (app
      // relaunch during playback / auto-resume) already has a MediaStatus that
      // would otherwise only arrive on the next push. Same convention as the
      // push path: a nil GCKMediaStatus is omitted, never delivered as nil.
      let mediaStatus = currentCastSession?.remoteMediaClient?.mediaStatus?.toMediaStatus()
      promise.resolve(
        withResult: InitialSnapshot(
          castState: self.cachedCastState,
          playServicesState: .success,
          devices: devices,
          currentSession: current,
          mediaStatus: mediaStatus
        )
      )
    }
    return promise
  }

  private func attachObservers(_ context: GCKCastContext) {
    dispatchPrecondition(condition: .onQueue(.main))
    guard !listenersAttached else { return }
    listenersAttached = true

    castStateObserver = NotificationCenter.default.addObserver(
      forName: .gckCastStateDidChange,
      object: nil,
      queue: .main
    ) { [weak self] _ in self?.handleCastStateChange() }

    // SDK-initiated discovery *starts* (first Cast-button tap, foreground
    // auto-resume) are tracked via the documented
    // `GCKDiscoveryManagerListener.didStartDiscoveryForDeviceCategory:`
    // callback — no JS-initiated call ever sees those, and `discoveryActive`
    // is not documented KVO-compliant, so the public listener is the only
    // vendor-supported signal. JS-driven transitions stay authoritative via
    // the `discoveryActive` read-backs in start/stopDiscovery. Known residual
    // gap, from the same header: the listener protocol has NO stop/suspend
    // counterpart, and the only SDK-initiated stop is the background suspend
    // (GCKDiscoveryManager class doc) — so `isDiscovering` can read a stale
    // `true` while the app is backgrounded, and re-syncs on foreground when
    // GCK restarts discovery and the callback fires again. No JS callback is
    // emitted here — the transport surface has no "discovering" event; JS
    // reads `isDiscovering` synchronously on demand (the AtomicFlag store is
    // thread-safe and holds no lock while calling out — T6).
    let discovery = CastDiscoveryListener(
      onUpdate: { [weak self] in
        guard let self else { return }
        self.onDevices?(self.readDevices(GCKCastContext.sharedInstance().discoveryManager))
      },
      onDiscoveryStarted: { [weak self] in
        self?.cachedDiscovering.store(true)
      })
    context.discoveryManager.add(discovery)
    discoveryListener = discovery

    let session = CastSessionListener(
      onEvent: { [weak self] event in self?.onLifecycle?(event) },
      onSessionActive: { [weak self] in
        self?.attachMediaListener()
        self?.attachDeviceStatusListener()
      },
      onSessionInactive: { [weak self] in
        self?.detachMediaListener()
        self?.detachDeviceStatusListener()
        self?.clearChannels()
        self?.flushPendingRequests(code: "interrupted", message: "The Cast session ended.")
      })
    context.sessionManager.add(session)
    sessionListener = session
  }

  private func detachObservers() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard listenersAttached else { return }
    listenersAttached = false
    let context = GCKCastContext.sharedInstance()
    if let observer = castStateObserver {
      NotificationCenter.default.removeObserver(observer)
      castStateObserver = nil
    }
    if let discovery = discoveryListener {
      context.discoveryManager.remove(discovery)
      discoveryListener = nil
    }
    if let session = sessionListener {
      context.sessionManager.remove(session)
      sessionListener = nil
    }
  }

  /// Override of `HybridObject.dispose()` — detach every GCK observer.
  ///
  /// Deliberate STRONG capture: `dispose()` is Nitro's final call before it
  /// releases this object, so a `[weak self]` hop could find the transport
  /// already deallocated and silently skip teardown — leaking the
  /// NotificationCenter observer and stranding selfRetained
  /// `CastRequestDelegate`s whose promises then never settle. The block keeps
  /// `self` alive exactly until cleanup completes on the main thread.
  func dispose() {
    CastDebugEventSink.detach()
    DispatchQueue.main.async {
      self.detachObservers()
      self.detachMediaListener()
      self.detachDeviceStatusListener()
      self.clearChannels()
      self.flushPendingRequests(code: "interrupted", message: "The Cast transport was disposed.")
      self.mediaStatusListener = nil
      self.deviceStatusListener = nil
      self.onState = nil
      self.onDevices = nil
      self.onLifecycle = nil
      self.onMediaStatus = nil
      self.onChannelMessage = nil
      self.onChannelStatus = nil
    }
  }

  // MARK: - mutations (re-resolve handles per call — Invariant 1)

  func startSession(deviceId: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async {
      let context = GCKCastContext.sharedInstance()
      guard let device = Self.findDevice(deviceId, context.discoveryManager) else {
        promise.reject(
          withError: castRejection(
            code: "appNotFound", message: "No Cast device with id \(deviceId)", nativeCode: nil))
        return
      }
      // Request accepted → resolve. The actual started/failed outcome streams
      // back as a lifecycle event (onSessionStarted / onSessionStartFailed).
      if context.sessionManager.startSession(with: device) {
        promise.resolve(withResult: ())
      } else {
        promise.reject(
          withError: castRejection(
            code: "failed", message: "Could not start a session with \(deviceId)", nativeCode: nil))
      }
    }
    return promise
  }

  func endCurrentSession(stopCasting: Bool) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async {
      let manager = GCKCastContext.sharedInstance().sessionManager
      let ended =
        stopCasting ? manager.endSessionAndStopCasting(stopCasting) : manager.endSession()
      if ended {
        promise.resolve(withResult: ())
      } else {
        promise.reject(
          withError: castRejection(
            code: "noSession", message: "There is no current session to end.", nativeCode: nil))
      }
    }
    return promise
  }

  // MARK: - device volume / mute (route to GCKCastSession — Invariant 1)

  func setDeviceVolume(volume: Double) throws -> Promise<Void> {
    withCastSession { $0.setDeviceVolume(Float(volume)) }
  }

  func setDeviceMuted(muted: Bool) throws -> Promise<Void> {
    withCastSession { $0.setDeviceMuted(muted) }
  }

  // MARK: - custom channels (Phase 5.2 — registry owned here, Invariant 1 for the session)

  func addChannel(channelNamespace namespace: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession
      else {
        promise.reject(
          withError: castRejection(
            code: "noSession", message: "There is no active Cast session.", nativeCode: nil))
        return
      }
      guard self.channels[namespace] == nil else {
        promise.reject(
          withError: castRejection(
            code: "alreadyRegistered",
            message: "A channel for \(namespace) is already registered.", nativeCode: nil))
        return
      }
      let channel = CastMessageChannel(
        namespace: namespace,
        onMessage: { [weak self] message in self?.onChannelMessage?(namespace, message) },
        onStatus: { [weak self] connected, writable in
          self?.onChannelStatus?(namespace, connected, writable)
        })
      // GCK returns NO when it refuses the registration (e.g. the namespace is
      // already registered on the session outside this registry) — recording
      // the channel anyway would hand JS a handle that can never receive.
      guard session.add(channel) else {
        promise.reject(
          withError: castRejection(
            code: "failed",
            message: "GCK refused to register a channel for \(namespace).", nativeCode: nil))
        return
      }
      self.channels[namespace] = channel
      // Initial status BEFORE resolving, so an awaiting façade reads a
      // populated value. This is the REAL current value (A2): `isConnected` is
      // often still false here — the virtual connection completes async and
      // `didConnect` streams the update when it does.
      self.onChannelStatus?(namespace, channel.isConnected, channel.isWritable)
      promise.resolve(withResult: ())
    }
    return promise
  }

  func removeChannel(channelNamespace namespace: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      if let channel = self.channels.removeValue(forKey: namespace) {
        // Best-effort: the session may already be gone (GCK dropped the
        // channel with it); removing from a live one keeps GCK in sync.
        GCKCastContext.sharedInstance().sessionManager.currentCastSession?.remove(channel)
      }
      promise.resolve(withResult: ())  // idempotent — not-registered resolves
    }
    return promise
  }

  func sendMessage(channelNamespace namespace: String, message: String) throws -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard let channel = self.channels[namespace] else {
        promise.reject(
          withError: castRejection(
            code: "invalidRequest",
            message: "No channel registered for \(namespace) — call addChannel first.",
            nativeCode: nil))
        return
      }
      // `-[GCKCastChannel sendTextMessage:error:]` returns BOOL + a `GCKError **`
      // out-param (not `NSError **`, so it is NOT bridged to `throws`). The BOOL
      // is the authority: reject on NO even if GCK left the error pointer empty.
      var error: GCKError?
      if channel.sendTextMessage(message, error: &error) {
        promise.resolve(withResult: ())
      } else if let error {
        // Reuse the transport's GCKError → CastError code mapping (same one the
        // request delegate uses) so send failures reject typed codes.
        promise.reject(
          withError: castRejection(
            code: error.toCastErrorCode(), message: error.localizedDescription,
            nativeCode: error.code))
      } else {
        promise.reject(
          withError: castRejection(
            code: "failed", message: "The message could not be sent.", nativeCode: nil))
      }
    }
    return promise
  }

  // MARK: - media transport (route to GCKRemoteMediaClient — Invariant 1)

  func loadMedia(request: MediaLoadRequest) throws -> Promise<Void> {
    withClient { $0.loadMedia(with: request.toGckMediaLoadRequestData()) }
  }

  // `customData` (v5-aug.5): forwarded via the GCK `…customData:` variants where
  // they exist. `nil` and the plain variants are equivalent (GCK sends no
  // customData field either way). `queueNext` / `queuePrev` /
  // `queueSetRepeatMode` have NO customData variant in the iOS SDK (verified
  // against the 4.8.4 header) — those params are Android-only and ignored here.

  func play(customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.play(withCustomData: customData?.toGckCustomData()) }
  }

  func pause(customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.pause(withCustomData: customData?.toGckCustomData()) }
  }

  func stop(customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.stop(withCustomData: customData?.toGckCustomData()) }
  }

  func seek(options: MediaSeekOptions) throws -> Promise<Void> {
    withClient { $0.seek(with: options.toGckMediaSeekOptions()) }
  }

  func setPlaybackRate(playbackRate: Double, customData: AnyMap?) throws -> Promise<Void> {
    withClient {
      $0.setPlaybackRate(Float(playbackRate), customData: customData?.toGckCustomData())
    }
  }

  func setActiveTrackIds(trackIds: [Double]) throws -> Promise<Void> {
    let ids = trackIds.map { NSNumber(value: $0) }
    return withClient { $0.setActiveTrackIDs(ids) }
  }

  func setTextTrackStyle(textTrackStyle: TextTrackStyle) throws -> Promise<Void> {
    withClient { $0.setTextTrackStyle(textTrackStyle.toGckTextTrackStyle()) }
  }

  func setStreamVolume(volume: Double, customData: AnyMap?) throws -> Promise<Void> {
    withClient {
      $0.setStreamVolume(Float(volume), customData: customData?.toGckCustomData())
    }
  }

  func setStreamMuted(muted: Bool, customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.setStreamMuted(muted, customData: customData?.toGckCustomData()) }
  }

  func queueLoad(
    items: [MediaQueueItem], startIndex: Double, repeatMode: MediaRepeatMode,
    customData: AnyMap?
  ) throws -> Promise<Void> {
    guard let start = Self.queueIndex(startIndex) else {
      return Self.rejectedIndex("startIndex", startIndex)
    }
    let gckItems = items.map { $0.toGckMediaQueueItem() }
    let options = GCKMediaQueueLoadOptions()
    options.startIndex = start
    options.repeatMode = repeatMode.toGckRepeatMode()
    if let customData { options.customData = customData.toGckCustomData() }
    return withClient { $0.queueLoad(gckItems, with: options) }
  }

  func queueInsertItems(
    items: [MediaQueueItem], beforeItemId: Double, customData: AnyMap?
  ) throws -> Promise<Void> {
    guard let before = Self.queueIndex(beforeItemId) else {
      return Self.rejectedIndex("beforeItemId", beforeItemId)
    }
    let gckItems = items.map { $0.toGckMediaQueueItem() }
    return withClient {
      $0.queueInsert(
        gckItems, beforeItemWithID: before, customData: customData?.toGckCustomData())
    }
  }

  func queueInsertAndPlayItem(
    item: MediaQueueItem, beforeItemId: Double, playPosition: Double?, customData: AnyMap?
  ) throws -> Promise<Void> {
    guard let before = Self.queueIndex(beforeItemId) else {
      return Self.rejectedIndex("beforeItemId", beforeItemId)
    }
    // Mirror the Android `toPlayPositionMs` guard: a NaN/±Inf/negative
    // playPosition would flow into GCK as a "real" TimeInterval (and NaN can't
    // even be JSON-serialized) — reject it before issuing the request.
    if let playPosition, !(playPosition.isFinite && playPosition >= 0) {
      return Self.rejectedIndex("playPosition", playPosition)
    }
    // GCK's only customData-capable variant also takes playPosition; an absent
    // playPosition maps to kGCKInvalidTimeInterval ("unset" — the item's
    // startTime governs), which is what the playPosition-less variant sends.
    let gckItem = item.toGckMediaQueueItem()
    return withClient {
      $0.queueInsertAndPlay(
        gckItem,
        beforeItemWithID: before,
        playPosition: playPosition ?? kGCKInvalidTimeInterval,
        customData: customData?.toGckCustomData())
    }
  }

  func queueReorderItems(
    itemIds: [Double], beforeItemId: Double, customData: AnyMap?
  ) throws -> Promise<Void> {
    guard let before = Self.queueIndex(beforeItemId) else {
      return Self.rejectedIndex("beforeItemId", beforeItemId)
    }
    let ids = itemIds.map { NSNumber(value: $0) }
    return withClient {
      $0.queueReorderItems(
        withIDs: ids, insertBeforeItemWithID: before,
        customData: customData?.toGckCustomData())
    }
  }

  func queueRemoveItems(itemIds: [Double], customData: AnyMap?) throws -> Promise<Void> {
    let ids = itemIds.map { NSNumber(value: $0) }
    return withClient {
      $0.queueRemoveItems(withIDs: ids, customData: customData?.toGckCustomData())
    }
  }

  // NOTE: no GCK iOS customData variant for next/prev/setRepeatMode — the
  // param is Android-only there (documented on the TS façade) and ignored.
  func queueNext(customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.queueNextItem() }
  }

  func queuePrev(customData: AnyMap?) throws -> Promise<Void> {
    withClient { $0.queuePreviousItem() }
  }

  func queueJumpToItem(itemId: Double, customData: AnyMap?) throws -> Promise<Void> {
    guard let id = Self.queueIndex(itemId) else {
      return Self.rejectedIndex("itemId", itemId)
    }
    return withClient {
      $0.queueJumpToItem(withID: id, customData: customData?.toGckCustomData())
    }
  }

  func queueSetRepeatMode(repeatMode: MediaRepeatMode, customData: AnyMap?) throws -> Promise<
    Void
  > {
    let mode = repeatMode.toGckRepeatMode()
    return withClient { $0.queueSetRepeatMode(mode) }
  }

  func requestMediaStatus() throws -> Promise<Void> {
    withClient { $0.requestStatus() }
  }

  /// Re-resolves the current session's `GCKRemoteMediaClient` on the main thread
  /// per call (never caches a handle — Invariant 1), runs `work` to issue the GCK
  /// request, and tracks it for exactly-once settlement. No session → reject
  /// `noSession`; never crashes.
  private func withClient(
    _ work: @escaping (GCKRemoteMediaClient) -> GCKRequest
  ) -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        // Disposed before this block ran — settle so the caller never hangs.
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard
        let client = GCKCastContext.sharedInstance().sessionManager.currentCastSession?
          .remoteMediaClient
      else {
        promise.reject(
          withError: castRejection(
            code: "noSession", message: "There is no active Cast session.", nativeCode: nil))
        return
      }
      let request = work(client)
      self.track(request, promise)
    }
    return promise
  }

  /// Sibling of `withClient` for session-level (non-media) GCK requests:
  /// re-resolves the current `GCKCastSession` on the main thread per call (never
  /// caches a handle — Invariant 1), runs `work` to issue the `GCKRequest`, and
  /// tracks it for exactly-once settlement (so teardown rejects it). No cast
  /// session → reject `noSession`; disposed before the block runs → `interrupted`.
  private func withCastSession(
    _ work: @escaping (GCKCastSession) -> GCKRequest
  ) -> Promise<Void> {
    let promise = Promise<Void>()
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        // Disposed before this block ran — settle so the caller never hangs.
        promise.reject(
          withError: castRejection(
            code: "interrupted", message: "The Cast transport was disposed.", nativeCode: nil))
        return
      }
      guard let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession else {
        promise.reject(
          withError: castRejection(
            code: "noSession", message: "There is no active Cast session.", nativeCode: nil))
        return
      }
      let request = work(session)
      self.track(request, promise)
    }
    return promise
  }

  private func track(_ request: GCKRequest, _ promise: Promise<Void>) {
    dispatchPrecondition(condition: .onQueue(.main))
    let delegate = CastRequestDelegate(promise: promise) { [weak self] settled in
      self?.pendingRequests.remove(settled)
    }
    pendingRequests.insert(delegate)
    delegate.track(request)
  }

  /// Safely convert a JS-supplied queue index/id (`Double`) to `UInt`. `UInt(Double)`
  /// *traps* on negative / NaN / infinite / fractional / overflow values, so the bridge
  /// would crash before the request could be rejected — use `exactly:` and surface a Cast
  /// error instead. `0` is valid (GCK's `kGCKMediaQueueInvalidItemID` append sentinel).
  private static func queueIndex(_ value: Double) -> UInt? { UInt(exactly: value) }

  /// A `Promise<Void>` already rejected with `invalidParameter` for an out-of-range index.
  private static func rejectedIndex(_ name: String, _ value: Double) -> Promise<Void> {
    let promise = Promise<Void>()
    promise.reject(
      withError: castRejection(
        code: "invalidParameter", message: "Invalid \(name): \(value)", nativeCode: nil))
    return promise
  }

  /// Bind the media-status listener to the current session's media client. Idempotent
  /// for a given client; re-resolves the client per call. Main thread.
  private func attachMediaListener() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard
      let client = GCKCastContext.sharedInstance().sessionManager.currentCastSession?
        .remoteMediaClient
    else { return }
    guard attachedMediaClient !== client else { return }

    let listener =
      mediaStatusListener
      ?? CastRemoteMediaClientListener { [weak self] status in self?.onMediaStatus?(status) }
    mediaStatusListener = listener

    if let previous = attachedMediaClient { previous.remove(listener) }
    client.add(listener)
    attachedMediaClient = client

    // Emit the current status immediately so subscribers don't wait for the next
    // change to learn what is already playing.
    if let status = client.mediaStatus?.toMediaStatus() { onMediaStatus?(status) }
  }

  private func detachMediaListener() {
    dispatchPrecondition(condition: .onQueue(.main))
    if let client = attachedMediaClient, let listener = mediaStatusListener {
      client.remove(listener)
    }
    attachedMediaClient = nil
  }

  /// Bind the device-status listener to the current cast session. Idempotent for
  /// a given session; re-resolves the session per call (Invariant 1). Main thread.
  /// Mirrors `attachMediaListener`.
  private func attachDeviceStatusListener() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession
    else { return }
    guard attachedStatusSession !== session else { return }

    let listener =
      deviceStatusListener
      ?? CastDeviceStatusListener { [weak self] event in self?.onLifecycle?(event) }
    deviceStatusListener = listener

    if let previous = attachedStatusSession { previous.remove(listener) }
    session.add(listener)
    attachedStatusSession = session
  }

  private func detachDeviceStatusListener() {
    dispatchPrecondition(condition: .onQueue(.main))
    if let session = attachedStatusSession, let listener = deviceStatusListener {
      session.remove(listener)
    }
    attachedStatusSession = nil
  }

  /// Drop every registered custom channel (A1). Called on session end/suspend
  /// and on dispose. Removes from the live session when one still exists
  /// (`willEnd` fires while it does); otherwise GCK already dropped the channel
  /// with the session and we only release our strong refs.
  private func clearChannels() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard !channels.isEmpty else { return }
    let session = GCKCastContext.sharedInstance().sessionManager.currentCastSession
    for channel in channels.values { session?.remove(channel) }
    channels.removeAll()
  }

  /// Reject every still-pending media request. Used on session end / teardown so a
  /// caller's promise never hangs after the client it targeted is gone (T6). Main thread.
  private func flushPendingRequests(code: String, message: String) {
    dispatchPrecondition(condition: .onQueue(.main))
    let pending = pendingRequests
    pendingRequests.removeAll()
    for delegate in pending { delegate.cancel(code: code, message: message) }
  }

  // MARK: - discovery controls (iOS)

  // DECISION (v5-xr6 / #625): the transport deliberately does NOT force
  // `startDiscovery()` at init. GCK's default contract
  // (`GCKCastOptions.startDiscoveryAfterFirstTapOnCastButton = YES`, SDK 4.5.3+)
  // gates discovery on the user's first `GCKUICastButton` tap so the iOS 14+
  // local-network permission prompt appears in context, and auto-manages it
  // with the foreground lifecycle afterwards — mirroring Android, where
  // "device discovery is completely managed by the CastContext". Force-starting
  // here would fire the LNA prompt at cold launch and defeat GCK's
  // battery/privacy design. Custom device pickers (no CastButton) call
  // `DiscoveryManager.startDiscovery()` from JS, per Google's own guidance.
  // https://developers.google.com/cast/docs/ios_sender/permissions_and_discovery

  func startDiscovery() throws {
    DispatchQueue.main.async { [weak self] in
      let manager = GCKCastContext.sharedInstance().discoveryManager
      manager.startDiscovery()
      // Read GCK's authoritative flag back instead of assuming success —
      // JS-driven transitions are owned here; SDK-initiated starts are caught
      // by the discovery listener callback (see `attachObservers`).
      self?.cachedDiscovering.store(manager.discoveryActive)
    }
  }

  func stopDiscovery() throws {
    DispatchQueue.main.async { [weak self] in
      let manager = GCKCastContext.sharedInstance().discoveryManager
      manager.stopDiscovery()
      self?.cachedDiscovering.store(manager.discoveryActive)
    }
  }

  func setPassiveScan(passive: Bool) throws {
    DispatchQueue.main.async { [weak self] in
      GCKCastContext.sharedInstance().discoveryManager.passiveScan = passive
      self?.cachedPassiveScan.store(passive)
    }
  }

  // MARK: - Cast UI (Phase 6.1 — main queue, Invariant 1)

  // The `Bool` contract is E7: `true` means "the present call was issued" —
  // GCK's `presentCastDialog` / `presentDefaultExpandedMediaControls` are
  // `void`, so actual presentation is not observable. Only the introductory
  // overlay verifies presentation (its GCK API returns a real `BOOL`). These
  // resolve `false` only for the graceful can't-show cases; they never reject.

  func showCastDialog() throws -> Promise<Bool> {
    let promise = Promise<Bool>()
    DispatchQueue.main.async {
      GCKCastContext.sharedInstance().presentCastDialog()
      promise.resolve(withResult: true)
    }
    return promise
  }

  func showExpandedControls() throws -> Promise<Bool> {
    let promise = Promise<Bool>()
    DispatchQueue.main.async {
      GCKCastContext.sharedInstance().presentDefaultExpandedMediaControls()
      promise.resolve(withResult: true)
    }
    return promise
  }

  func showIntroductoryOverlay(once: Bool) throws -> Promise<Bool> {
    let promise = Promise<Bool>()
    DispatchQueue.main.async {
      let context = GCKCastContext.sharedInstance()
      // The non-deprecated overlay API needs a visible button anchor; without
      // one the overlay cannot show → resolve `false` (never hang, never
      // reject).
      guard let button = CastButtonRegistry.current else {
        promise.resolve(withResult: false)
        return
      }
      // iOS keeps GCK's own persistent "shown once" flag (E2 note): clearing
      // it makes the anchored present call below show again. Cleared only
      // AFTER the anchor guard so a failed `{once: false}` call leaves the
      // flag untouched — matching Android, whose false paths never write.
      if !once {
        context.clearCastInstructionsShownFlag()
      }
      // GCK's BOOL is authoritative here: `false` = not shown (already shown
      // before, or GCK could not locate the button).
      promise.resolve(
        withResult: context.presentCastInstructionsViewControllerOnce(with: button))
    }
    return promise
  }

  // MARK: - Cast setup / diagnostics UI (Phase 6.2)

  /// Android-only diagnostic (8A): the Play Services error dialog has no iOS
  /// counterpart, so this always resolves `false` ("not shown"), never rejects.
  func showPlayServicesErrorDialog(errorCode: Double) throws -> Promise<Bool> {
    let promise = Promise<Bool>()
    promise.resolve(withResult: false)
    return promise
  }

  // MARK: - helpers

  private func handleCastStateChange() {
    cachedCastState = Self.mapState(GCKCastContext.sharedInstance().castState)
    onState?(cachedCastState)
  }

  private func readDevices(_ manager: GCKDiscoveryManager) -> [Device] {
    var devices: [Device] = []
    if manager.deviceCount > 0 {
      for index in 0..<manager.deviceCount {
        devices.append(manager.device(at: index).toDevice())
      }
    }
    return devices
  }

  private static func findDevice(
    _ deviceId: String, _ manager: GCKDiscoveryManager
  ) -> GCKDevice? {
    guard manager.deviceCount > 0 else { return nil }
    for index in 0..<manager.deviceCount {
      let device = manager.device(at: index)
      if device.deviceID == deviceId { return device }
    }
    return nil
  }

  /// Build the generated `SessionInfo` from a GCK session. `internal` (not
  /// `fileprivate`) so the separate-file `CastDeviceStatusListener` can reuse it.
  /// Five detail fields are cast-only, so they populate only when the session
  /// is a `GCKCastSession`; a plain `GCKSession` leaves them `nil`.
  /// (`applicationStatus` is the exception: it reads the base
  /// `GCKSession.deviceStatusText`, so it populates for any session.) Reads the
  /// current values off the handle GCK hands us — never a cached one (Invariant 1).
  internal static func sessionInfo(_ session: GCKSession?) -> SessionInfo? {
    guard let session else { return nil }
    let castSession = session as? GCKCastSession
    return SessionInfo(
      sessionId: session.sessionID ?? "",
      device: session.device.toDevice(),
      applicationMetadata: castSession?.applicationMetadata?.toApplicationMetadata(),
      applicationStatus: session.deviceStatusText,
      deviceVolume: castSession.map { Double($0.currentDeviceVolume) },
      deviceMuted: castSession.map { $0.currentDeviceMuted },
      standbyState: castSession?.standbyStatus.toStandbyState(),
      activeInputState: castSession?.activeInputStatus.toActiveInputState()
    )
  }

  private static func mapState(_ state: GCKCastState) -> CastState {
    switch state {
    case .noDevicesAvailable: return .nodevicesavailable
    case .notConnected: return .notconnected
    case .connecting: return .connecting
    case .connected: return .connected
    @unknown default: return .notconnected
    }
  }

  fileprivate static func suspendReason(_ reason: GCKConnectionSuspendReason) -> String {
    switch reason {
    case .appBackgrounded: return "appBackgrounded"
    case .networkError: return "networkError"
    default: return "other"
    }
  }
}

// MARK: - cross-thread flag box

/// Lock-boxed `Bool` — the Swift analogue of the Android transport's `@Volatile`
/// cached flags. Written on the main thread inside the GCK hops; read
/// synchronously from the JS thread by the Nitro property accessors. Never hold
/// the lock while calling out (the box only stores/loads the raw value), so no
/// JS callback can ever run with a lock held.
private final class AtomicFlag {
  private let lock = NSLock()
  private var value: Bool

  init(_ value: Bool) { self.value = value }

  func load() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return value
  }

  func store(_ newValue: Bool) {
    lock.lock()
    defer { lock.unlock() }
    value = newValue
  }
}

// MARK: - GCK listener adapters (NSObject — required by the GCK protocols)

/// Forwards `GCKDiscoveryManager` callbacks to closures: device-list updates
/// (`onUpdate`) and SDK-initiated discovery starts (`onDiscoveryStarted` — the
/// documented `didStartDiscoveryForDeviceCategory:` optional method, GCK's only
/// public discovery-lifecycle signal; the protocol has no stop/suspend
/// counterpart). Both are *optional* selectors, so the same
/// compiles-clean-but-silent hazard as `CastSessionListener` applies —
/// `internal` (not `private`) so `DiscoveryListenerSelectorTests` can pin them
/// via `@testable import`.
final class CastDiscoveryListener: NSObject, GCKDiscoveryManagerListener {
  private let onUpdate: () -> Void
  private let onDiscoveryStarted: () -> Void
  init(onUpdate: @escaping () -> Void, onDiscoveryStarted: @escaping () -> Void = {}) {
    self.onUpdate = onUpdate
    self.onDiscoveryStarted = onDiscoveryStarted
    super.init()
  }
  func didUpdateDeviceList() { onUpdate() }
  /// The explicit `@objc(...)` pins the exact Obj-C selector GCK probes with
  /// `respondsToSelector:` at compile time, so a Swift-importer rename can
  /// never silently detach this callback. Fires per device category; storing
  /// `true` is idempotent, so multiple categories are harmless.
  @objc(didStartDiscoveryForDeviceCategory:)
  func didStartDiscovery(forDeviceCategory deviceCategory: String) { onDiscoveryStarted() }
}

/// Forwards `GCKSessionManager` lifecycle callbacks to a single closure as
/// `SessionLifecycleEvent`s. These are *optional* protocol methods — a wrong
/// Swift signature compiles clean but bridges to a selector GCK never calls
/// (silently dead). The bridged selectors are pinned by
/// `SessionListenerSelectorTests`; `internal` (not `private`) so the test
/// target can reach the type via `@testable import`.
final class CastSessionListener: NSObject, GCKSessionManagerListener {
  private let onEvent: (SessionLifecycleEvent) -> Void
  /// Fired when a session becomes current (started/resumed) and when it leaves —
  /// the transport uses these to (re)bind/tear down its media-status listener and
  /// flush pending media requests. Kept on this single session listener so the
  /// foundation's session registration stays the only one.
  private let onSessionActive: () -> Void
  private let onSessionInactive: () -> Void

  init(
    onEvent: @escaping (SessionLifecycleEvent) -> Void,
    onSessionActive: @escaping () -> Void = {},
    onSessionInactive: @escaping () -> Void = {}
  ) {
    self.onEvent = onEvent
    self.onSessionActive = onSessionActive
    self.onSessionInactive = onSessionInactive
    super.init()
  }

  private func emit(
    _ type: SessionEventType, session: SessionInfo? = nil, error: CastError? = nil,
    sessionId: String? = nil, deviceId: String? = nil, reason: String? = nil
  ) {
    onEvent(
      SessionLifecycleEvent(
        type: type, session: session, error: error, sessionId: sessionId, deviceId: deviceId,
        reason: reason))
  }

  func sessionManager(_ sessionManager: GCKSessionManager, willStart session: GCKSession) {
    emit(.starting, deviceId: session.device.deviceID)
  }
  func sessionManager(_ sessionManager: GCKSessionManager, didStart session: GCKSession) {
    onSessionActive()
    emit(.started, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, didFailToStart session: GCKSession, withError error: Error
  ) {
    emit(.startfailed, error: toCastError(error))
  }
  func sessionManager(_ sessionManager: GCKSessionManager, willEnd session: GCKSession) {
    onSessionInactive()
    emit(.ending, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, didEnd session: GCKSession, withError error: Error?
  ) {
    // Idempotent with `willEnd`; covers an abrupt `didEnd` that skips `willEnd`.
    onSessionInactive()
    emit(.ended, error: toCastError(error))
  }
  func sessionManager(_ sessionManager: GCKSessionManager, willResumeSession session: GCKSession) {
    emit(.resuming, sessionId: session.sessionID)
  }
  func sessionManager(_ sessionManager: GCKSessionManager, didResumeSession session: GCKSession) {
    onSessionActive()
    emit(.resumed, session: HybridCastTransport.sessionInfo(session))
  }
  // NOTE: the argument label must be `with` (not `withReason`) — GCK's optional
  // requirement is `sessionManager:didSuspendSession:withReason:`, which imports
  // into Swift as `sessionManager(_:didSuspend:with:)`. A `withReason` label
  // bridges to a *different* selector that GCK never calls, so the suspended
  // event silently never fires (pinned by `SessionListenerSelectorTests`).
  func sessionManager(
    _ sessionManager: GCKSessionManager, didSuspend session: GCKSession,
    with reason: GCKConnectionSuspendReason
  ) {
    // TS treats `suspended` as a teardown (see `session.slice`), so detach the
    // media listener and flush pending requests here too — otherwise a late
    // media-status callback or a never-arriving request could repopulate / hang
    // state JS already considers gone. Re-attached on `didResumeSession`.
    onSessionInactive()
    emit(.suspended, reason: HybridCastTransport.suspendReason(reason))
  }

  // MARK: device-status (all collapse to `deviceStatusChanged`, carrying a fresh
  // full `sessionInfo`). GCK declares each volume/status callback in two flavors —
  // a generic `session:` and a cast-specific `castSession:`. Which one(s) GCK
  // actually invokes for a cast session is device-gated and unverified here, so we
  // implement BOTH: a silent miss (only one flavor fires and we skipped it) is a
  // real bug, whereas a double-emit (both fire) is harmless — each rebuilds the
  // same fresh full `sessionInfo`, an idempotent overwrite downstream.
  // `didUpdateDevice:` has only a `session:` flavor. All are *optional* selectors
  // pinned from the GCK headers (a wrong signature compiles clean and never fires).
  func sessionManager(
    _ sessionManager: GCKSessionManager, session: GCKSession, didReceiveDeviceVolume volume: Float,
    muted: Bool
  ) {
    emit(.devicestatuschanged, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, castSession: GCKCastSession,
    didReceiveDeviceVolume volume: Float, muted: Bool
  ) {
    emit(.devicestatuschanged, session: HybridCastTransport.sessionInfo(castSession))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, session: GCKSession, didReceiveDeviceStatus statusText: String?
  ) {
    emit(.devicestatuschanged, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, castSession: GCKCastSession,
    didReceiveDeviceStatus statusText: String?
  ) {
    emit(.devicestatuschanged, session: HybridCastTransport.sessionInfo(castSession))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, session: GCKSession, didUpdate device: GCKDevice
  ) {
    emit(.devicestatuschanged, session: HybridCastTransport.sessionInfo(session))
  }
}

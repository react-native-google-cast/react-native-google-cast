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

  private var cachedCastState: CastState = .notconnected
  private var cachedDiscovering = false
  private var cachedPassiveScan = false

  override init() { super.init() }

  // iOS has no Play-Services gating; casting is available once GCKCastContext is
  // configured at launch (the v5 SDK-init step).
  var isAvailable: Bool { true }
  var isDiscovering: Bool { cachedDiscovering }
  var isPassiveScan: Bool { cachedPassiveScan }

  // MARK: - init + subscribe (atomic, main thread)

  func initAndSubscribe(
    onState: @escaping (_ castState: CastState) -> Void,
    onDevices: @escaping (_ devices: [Device]) -> Void,
    onLifecycle: @escaping (_ event: SessionLifecycleEvent) -> Void,
    onMediaStatus: @escaping (_ status: MediaStatus) -> Void
  ) throws -> Promise<InitialSnapshot> {
    self.onState = onState
    self.onDevices = onDevices
    self.onLifecycle = onLifecycle
    self.onMediaStatus = onMediaStatus

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
      self.attachObservers(context)
      // If a session was already current before we subscribed, bind the media
      // listener now so status updates flow without waiting for the next start.
      self.attachMediaListener()

      self.cachedCastState = Self.mapState(context.castState)
      self.cachedPassiveScan = context.discoveryManager.passiveScan
      let devices = self.readDevices(context.discoveryManager)
      let current = Self.sessionInfo(context.sessionManager.currentCastSession)
      promise.resolve(
        withResult: InitialSnapshot(
          castState: self.cachedCastState,
          playServicesState: .success,
          devices: devices,
          currentSession: current
        )
      )
    }
    return promise
  }

  private func attachObservers(_ context: GCKCastContext) {
    guard !listenersAttached else { return }
    listenersAttached = true

    castStateObserver = NotificationCenter.default.addObserver(
      forName: .gckCastStateDidChange,
      object: nil,
      queue: .main
    ) { [weak self] _ in self?.handleCastStateChange() }

    let discovery = CastDiscoveryListener { [weak self] in
      guard let self else { return }
      self.onDevices?(self.readDevices(GCKCastContext.sharedInstance().discoveryManager))
    }
    context.discoveryManager.add(discovery)
    discoveryListener = discovery

    let session = CastSessionListener(
      onEvent: { [weak self] event in self?.onLifecycle?(event) },
      onSessionActive: { [weak self] in self?.attachMediaListener() },
      onSessionInactive: { [weak self] in
        self?.detachMediaListener()
        self?.flushPendingRequests(code: "interrupted", message: "The Cast session ended.")
      })
    context.sessionManager.add(session)
    sessionListener = session
  }

  private func detachObservers() {
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
  func dispose() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.detachObservers()
      self.detachMediaListener()
      self.flushPendingRequests(code: "interrupted", message: "The Cast transport was disposed.")
      self.mediaStatusListener = nil
      self.onState = nil
      self.onDevices = nil
      self.onLifecycle = nil
      self.onMediaStatus = nil
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

  // MARK: - media transport (route to GCKRemoteMediaClient — Invariant 1)

  func loadMedia(request: MediaLoadRequest) throws -> Promise<Void> {
    withClient { $0.loadMedia(with: request.toGckMediaLoadRequestData()) }
  }

  func play() throws -> Promise<Void> { withClient { $0.play() } }

  func pause() throws -> Promise<Void> { withClient { $0.pause() } }

  func stop() throws -> Promise<Void> { withClient { $0.stop() } }

  func seek(options: MediaSeekOptions) throws -> Promise<Void> {
    withClient { $0.seek(with: options.toGckMediaSeekOptions()) }
  }

  func setPlaybackRate(playbackRate: Double) throws -> Promise<Void> {
    withClient { $0.setPlaybackRate(Float(playbackRate)) }
  }

  func setActiveTrackIds(trackIds: [Double]) throws -> Promise<Void> {
    let ids = trackIds.map { NSNumber(value: $0) }
    return withClient { $0.setActiveTrackIDs(ids) }
  }

  func setTextTrackStyle(textTrackStyle: TextTrackStyle) throws -> Promise<Void> {
    withClient { $0.setTextTrackStyle(textTrackStyle.toGckTextTrackStyle()) }
  }

  func setStreamVolume(volume: Double) throws -> Promise<Void> {
    withClient { $0.setStreamVolume(Float(volume)) }
  }

  func setStreamMuted(muted: Bool) throws -> Promise<Void> {
    withClient { $0.setStreamMuted(muted) }
  }

  func queueLoad(
    items: [MediaQueueItem], startIndex: Double, repeatMode: MediaRepeatMode
  ) throws -> Promise<Void> {
    guard let start = Self.queueIndex(startIndex) else {
      return Self.rejectedIndex("startIndex", startIndex)
    }
    let gckItems = items.map { $0.toGckMediaQueueItem() }
    let options = GCKMediaQueueLoadOptions()
    options.startIndex = start
    options.repeatMode = repeatMode.toGckRepeatMode()
    return withClient { $0.queueLoad(gckItems, with: options) }
  }

  func queueInsertItems(items: [MediaQueueItem], beforeItemId: Double) throws -> Promise<Void> {
    guard let before = Self.queueIndex(beforeItemId) else {
      return Self.rejectedIndex("beforeItemId", beforeItemId)
    }
    let gckItems = items.map { $0.toGckMediaQueueItem() }
    return withClient { $0.queueInsert(gckItems, beforeItemWithID: before) }
  }

  func queueReorderItems(itemIds: [Double], beforeItemId: Double) throws -> Promise<Void> {
    guard let before = Self.queueIndex(beforeItemId) else {
      return Self.rejectedIndex("beforeItemId", beforeItemId)
    }
    let ids = itemIds.map { NSNumber(value: $0) }
    return withClient {
      $0.queueReorderItems(withIDs: ids, insertBeforeItemWithID: before)
    }
  }

  func queueRemoveItems(itemIds: [Double]) throws -> Promise<Void> {
    let ids = itemIds.map { NSNumber(value: $0) }
    return withClient { $0.queueRemoveItems(withIDs: ids) }
  }

  func queueNext() throws -> Promise<Void> { withClient { $0.queueNextItem() } }

  func queuePrev() throws -> Promise<Void> { withClient { $0.queuePreviousItem() } }

  func queueJumpToItem(itemId: Double) throws -> Promise<Void> {
    guard let id = Self.queueIndex(itemId) else {
      return Self.rejectedIndex("itemId", itemId)
    }
    return withClient { $0.queueJumpToItem(withID: id) }
  }

  func queueSetRepeatMode(repeatMode: MediaRepeatMode) throws -> Promise<Void> {
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

  private func track(_ request: GCKRequest, _ promise: Promise<Void>) {
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
    if let client = attachedMediaClient, let listener = mediaStatusListener {
      client.remove(listener)
    }
    attachedMediaClient = nil
  }

  /// Reject every still-pending media request. Used on session end / teardown so a
  /// caller's promise never hangs after the client it targeted is gone (T6). Main thread.
  private func flushPendingRequests(code: String, message: String) {
    let pending = pendingRequests
    pendingRequests.removeAll()
    for delegate in pending { delegate.cancel(code: code, message: message) }
  }

  // MARK: - discovery controls (iOS)

  func startDiscovery() throws {
    DispatchQueue.main.async { [weak self] in
      GCKCastContext.sharedInstance().discoveryManager.startDiscovery()
      self?.cachedDiscovering = true
    }
  }

  func stopDiscovery() throws {
    DispatchQueue.main.async { [weak self] in
      GCKCastContext.sharedInstance().discoveryManager.stopDiscovery()
      self?.cachedDiscovering = false
    }
  }

  func setPassiveScan(passive: Bool) throws {
    DispatchQueue.main.async { [weak self] in
      GCKCastContext.sharedInstance().discoveryManager.passiveScan = passive
      self?.cachedPassiveScan = passive
    }
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

  fileprivate static func sessionInfo(_ session: GCKSession?) -> SessionInfo? {
    guard let session else { return nil }
    return SessionInfo(sessionId: session.sessionID ?? "", device: session.device.toDevice())
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

// MARK: - GCK listener adapters (NSObject — required by the GCK protocols)

/// Forwards `GCKDiscoveryManager` device-list updates to a closure.
private final class CastDiscoveryListener: NSObject, GCKDiscoveryManagerListener {
  private let onUpdate: () -> Void
  init(onUpdate: @escaping () -> Void) {
    self.onUpdate = onUpdate
    super.init()
  }
  func didUpdateDeviceList() { onUpdate() }
}

/// Forwards `GCKSessionManager` lifecycle callbacks to a single closure as
/// `SessionLifecycleEvent`s. These are *optional* protocol methods — the exact
/// bridged Swift selectors are a Phase 3 spike verification item.
private final class CastSessionListener: NSObject, GCKSessionManagerListener {
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
  func sessionManager(
    _ sessionManager: GCKSessionManager, didSuspend session: GCKSession,
    withReason reason: GCKConnectionSuspendReason
  ) {
    emit(.suspended, reason: HybridCastTransport.suspendReason(reason))
  }
}

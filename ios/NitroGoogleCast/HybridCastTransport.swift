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

  private var castStateObserver: NSObjectProtocol?
  private var discoveryListener: CastDiscoveryListener?
  private var sessionListener: CastSessionListener?
  private var listenersAttached = false

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
    onLifecycle: @escaping (_ event: SessionLifecycleEvent) -> Void
  ) throws -> Promise<InitialSnapshot> {
    self.onState = onState
    self.onDevices = onDevices
    self.onLifecycle = onLifecycle

    let promise = Promise<InitialSnapshot>()
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let context = GCKCastContext.sharedInstance()
      self.attachObservers(context)

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

    let session = CastSessionListener { [weak self] event in
      self?.onLifecycle?(event)
    }
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
      self?.detachObservers()
      self?.onState = nil
      self?.onDevices = nil
      self?.onLifecycle = nil
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
  init(onEvent: @escaping (SessionLifecycleEvent) -> Void) {
    self.onEvent = onEvent
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
    emit(.started, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, didFailToStart session: GCKSession, withError error: Error
  ) {
    emit(.startfailed, error: toCastError(error))
  }
  func sessionManager(_ sessionManager: GCKSessionManager, willEnd session: GCKSession) {
    emit(.ending, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, didEnd session: GCKSession, withError error: Error?
  ) {
    emit(.ended, error: toCastError(error))
  }
  func sessionManager(_ sessionManager: GCKSessionManager, willResumeSession session: GCKSession) {
    emit(.resuming, sessionId: session.sessionID)
  }
  func sessionManager(_ sessionManager: GCKSessionManager, didResumeSession session: GCKSession) {
    emit(.resumed, session: HybridCastTransport.sessionInfo(session))
  }
  func sessionManager(
    _ sessionManager: GCKSessionManager, didSuspend session: GCKSession,
    withReason reason: GCKConnectionSuspendReason
  ) {
    emit(.suspended, reason: HybridCastTransport.suspendReason(reason))
  }
}

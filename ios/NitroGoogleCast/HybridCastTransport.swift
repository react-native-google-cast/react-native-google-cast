import Foundation
import GoogleCast
import NitroModules

/// Nitro implementation of the singleton Cast transport (iOS), backed by the
/// Google Cast SDK (GCK).
///
/// Design notes (see plan: "thin Nitro bridge + fat TypeScript"):
/// - This is the ONLY stateful native object. TS façades + the central
///   session-state machine route through it; nothing else holds native state.
/// - All GCK access happens on the main thread. The current cast state is
///   cached so `getCastState()` is a cheap, thread-safe read from any thread
///   (avoids a synchronous thread hop in a Nitro getter — see Codex #3 / T6).
/// - Listener state is touched only on the main thread, so no locks are needed.
///
/// TODO(Phase 2/3): move the GCKCastState→CastState conversion into a dedicated
/// `CastState+GCK.swift` converter file per the build-nitro-modules conventions.
final class HybridCastTransport: HybridCastTransportSpec {
  private var listeners: [UUID: (CastState) -> Void] = [:]
  private var stateObserver: NSObjectProtocol?
  private var cachedState: CastState = .notconnected

  override init() {
    super.init()
    DispatchQueue.main.async { [weak self] in
      self?.startObservingIfNeeded()
    }
  }

  // iOS has no Play-Services-style gating; casting is available once the
  // GCKCastContext shared instance has been configured at app launch (the v5
  // SDK-init step). TODO(verify): expose a stronger check if one exists.
  var isAvailable: Bool { true }

  func getCastState() throws -> CastState {
    cachedState
  }

  func addCastStateListener(
    listener: @escaping (_ state: CastState) -> Void
  ) throws -> ListenerSubscription {
    let id = UUID()
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.listeners[id] = listener
      self.startObservingIfNeeded()
      // Late-subscriber replay: deliver the current state immediately.
      listener(self.cachedState)
    }
    return ListenerSubscription(remove: { [weak self] in
      DispatchQueue.main.async {
        guard let self else { return }
        self.listeners[id] = nil
        self.stopObservingIfIdle()
      }
    })
  }

  // MARK: - GCK wiring (main thread only)

  private func startObservingIfNeeded() {
    refreshCachedState()
    guard stateObserver == nil else { return }
    // The GoogleCast SDK exposes this as a Swift-native NSNotification.Name.
    stateObserver = NotificationCenter.default.addObserver(
      forName: .gckCastStateDidChange,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.handleStateChange()
    }
  }

  private func stopObservingIfIdle() {
    guard listeners.isEmpty, let observer = stateObserver else { return }
    NotificationCenter.default.removeObserver(observer)
    stateObserver = nil
  }

  private func handleStateChange() {
    refreshCachedState()
    for listener in listeners.values {
      listener(cachedState)
    }
  }

  private func refreshCachedState() {
    cachedState = Self.map(GCKCastContext.sharedInstance().castState)
  }

  private static func map(_ state: GCKCastState) -> CastState {
    switch state {
    case .noDevicesAvailable: return .nodevicesavailable
    case .notConnected: return .notconnected
    case .connecting: return .connecting
    case .connected: return .connected
    @unknown default: return .notconnected
    }
  }
}

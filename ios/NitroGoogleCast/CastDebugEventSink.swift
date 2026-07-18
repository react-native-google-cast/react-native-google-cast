import Foundation

/// Debug-only fake seam (T3): hands `HybridCastDebug.inject*` the *same* stored
/// `initAndSubscribe` callbacks the real GCK listeners invoke on
/// `HybridCastTransport`, so tier-1 Maestro E2E can drive the real Nitro
/// boundary (native → JS callback delivery) on a simulator where Cast
/// discovery cannot work.
///
/// All gating lives here: the storage and both mutators compile to no-ops
/// outside `DEBUG`, so the transport can call `attach`/`detach`
/// unconditionally and release builds carry no seam.
///
/// Threading: `attach` runs on the JS thread inside `initAndSubscribe`
/// (mirroring the transport's own callback-var assignment); `emitters` is read
/// on the main thread by `HybridCastDebug.inject*`, matching real GCK
/// main-thread event delivery.
enum CastDebugEventSink {
  /// Unconditionally declared so `HybridCastDebug.inject`'s signature compiles
  /// in every configuration; the *storage* below only exists under `DEBUG`.
  struct Emitters {
    let emitState: (CastState) -> Void
    let emitDevices: ([Device]) -> Void
    let emitLifecycle: (SessionLifecycleEvent) -> Void
    let emitMediaStatus: (MediaStatus) -> Void
  }

  #if DEBUG
    private(set) static var emitters: Emitters?
  #endif

  /// Called by `HybridCastTransport.initAndSubscribe` right after it stores
  /// the JS callbacks. The closures must read the transport's *current*
  /// callback vars (not capture the parameters), so a later `dispose()`
  /// nulling them also silences the seam.
  static func attach(
    emitState: @escaping (CastState) -> Void,
    emitDevices: @escaping ([Device]) -> Void,
    emitLifecycle: @escaping (SessionLifecycleEvent) -> Void,
    emitMediaStatus: @escaping (MediaStatus) -> Void
  ) {
    #if DEBUG
      emitters = Emitters(
        emitState: emitState,
        emitDevices: emitDevices,
        emitLifecycle: emitLifecycle,
        emitMediaStatus: emitMediaStatus)
    #endif
  }

  /// Called by `HybridCastTransport.dispose()`.
  static func detach() {
    #if DEBUG
      emitters = nil
    #endif
  }
}

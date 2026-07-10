import Foundation
import GoogleCast
import NitroModules

/// Forwards `GCKCastDeviceStatusListener` standby / active-input status changes
/// to a closure as `SessionLifecycleEvent`s.
///
/// This is a *different* GCK protocol from `GCKSessionManagerListener`: standby
/// and active-input changes are pushed only to listeners registered directly on
/// the `GCKCastSession` via `addDeviceStatusListener:` — the session manager
/// never delivers them. GCK retains device-status listeners weakly, so the
/// transport owns the single strong reference and attaches/detaches it across the
/// session lifecycle (mirrors `CastRemoteMediaClientListener`).
///
/// Every event carries a full fresh `sessionInfo` built from the `castSession`
/// GCK hands us (Invariant 1 forbids caching a handle, not using the argument).
///
/// These are *optional* protocol methods — a wrong bridged Swift signature
/// compiles clean and silently never fires. The two signatures below are pinned
/// against the installed GCK headers; real firing is device-gated (needs a
/// physical Cast device).
final class CastDeviceStatusListener: NSObject, GCKCastDeviceStatusListener {
  private let onEvent: (SessionLifecycleEvent) -> Void

  init(onEvent: @escaping (SessionLifecycleEvent) -> Void) {
    self.onEvent = onEvent
    super.init()
  }

  func castSession(_ castSession: GCKCastSession, didReceive standbyStatus: GCKStandbyStatus) {
    onEvent(
      SessionLifecycleEvent(
        type: .standbystatechanged, session: HybridCastTransport.sessionInfo(castSession),
        error: nil, sessionId: nil, deviceId: nil, reason: nil))
  }

  func castSession(
    _ castSession: GCKCastSession, didReceive activeInputStatus: GCKActiveInputStatus
  ) {
    onEvent(
      SessionLifecycleEvent(
        type: .activeinputstatechanged, session: HybridCastTransport.sessionInfo(castSession),
        error: nil, sessionId: nil, deviceId: nil, reason: nil))
  }
}

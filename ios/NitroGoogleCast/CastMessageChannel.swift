import Foundation
import GoogleCast

/// A registered custom channel: `GCKCastChannel` subclass forwarding inbound
/// text messages and connection-status changes to closures (Phase 5.2).
///
/// Unlike the `GCKSessionManagerListener` adapters, these are base-class
/// *overrides* (not optional protocol selectors), so a wrong signature fails to
/// compile — no silent-miss hazard. The transport owns the single strong
/// reference per namespace and clears its registry on session end/suspend (A1).
final class CastMessageChannel: GCKCastChannel {
  private let onMessage: (String) -> Void
  /// (connected, writable) — emitted on every connect/disconnect/writable change.
  private let onStatus: (Bool, Bool) -> Void

  init(
    namespace: String,
    onMessage: @escaping (String) -> Void,
    onStatus: @escaping (Bool, Bool) -> Void
  ) {
    self.onMessage = onMessage
    self.onStatus = onStatus
    super.init(namespace: namespace)
  }

  override func didReceiveTextMessage(_ message: String) {
    onMessage(message)
  }

  override func didConnect() {
    emitStatus()
  }

  override func didDisconnect() {
    emitStatus()
  }

  override func didChangeWritableState(_ isWritable: Bool) {
    emitStatus()
  }

  /// Read the live GCK properties rather than trusting callback arguments —
  /// one path for all three status events.
  private func emitStatus() {
    onStatus(isConnected, isWritable)
  }
}

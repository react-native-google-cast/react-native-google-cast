import Foundation
import GoogleCast
import NitroModules

/// Forwards `GCKRemoteMediaClient` media-status updates to a closure as the
/// generated `MediaStatus` struct.
///
/// GCK reports `nil` when no media is loaded; the generated `onMediaStatus`
/// callback only carries a non-optional `MediaStatus`, so the `nil` case is
/// dropped here and the TS façade derives "no media" from session state instead.
/// `GCKRemoteMediaClient` retains its listeners weakly, so the transport owns the
/// strong reference and attaches/detaches it across session lifecycle.
final class CastRemoteMediaClientListener: NSObject, GCKRemoteMediaClientListener {
  private let onUpdate: (MediaStatus) -> Void

  init(onUpdate: @escaping (MediaStatus) -> Void) {
    self.onUpdate = onUpdate
    super.init()
  }

  func remoteMediaClient(_ client: GCKRemoteMediaClient, didUpdate mediaStatus: GCKMediaStatus?) {
    guard let mediaStatus else { return }
    onUpdate(mediaStatus.toMediaStatus())
  }
}

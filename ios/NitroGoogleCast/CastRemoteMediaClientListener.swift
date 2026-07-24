import Foundation
import GoogleCast
import NitroModules

/// Forwards `GCKRemoteMediaClient` media-status updates to a closure as the
/// generated `MediaStatus` struct.
///
/// GCK reports `nil` when no media is loaded. A `nil` while the session stays
/// alive (media unloaded via `stop()`, or the last queue item removed) is
/// forwarded as a *clear* (v5-82w) so the TS store drops its cached status
/// instead of serving the last non-nil one indefinitely; session-end teardown
/// is signalled through the lifecycle stream, never through this listener.
/// `GCKRemoteMediaClient` retains its listeners weakly, so the transport owns the
/// strong reference and attaches/detaches it across session lifecycle.
final class CastRemoteMediaClientListener: NSObject, GCKRemoteMediaClientListener {
  private let onUpdate: (MediaStatus?) -> Void

  init(onUpdate: @escaping (MediaStatus?) -> Void) {
    self.onUpdate = onUpdate
    super.init()
  }

  func remoteMediaClient(_ client: GCKRemoteMediaClient, didUpdate mediaStatus: GCKMediaStatus?) {
    onUpdate(mediaStatus?.toMediaStatus())
  }
}

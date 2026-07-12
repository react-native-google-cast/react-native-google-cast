import GoogleCast
import UIKit

/// Attach-ordered registry of mounted CastButton host views (E10). The single
/// consumer is `showIntroductoryOverlay`, which needs a visible
/// `GCKUICastButton` anchor for GCK's non-deprecated
/// `presentCastInstructionsViewControllerOnce(with:)` API.
///
/// - **Main thread only** (asserted): registration is driven by
///   `didMoveToWindow` and consumed by the transport's main-queue hops.
/// - **Attach order, last attached wins**: `register` (window attach) appends,
///   `unregister` (window detach / recycle) removes, so `current` resolves the
///   most recently attached candidate — mirroring the Android registry.
/// - **Weak entries**: a deallocated host can never be handed out; dead
///   entries are compacted on every mutation.
enum CastButtonRegistry {
  private struct Entry {
    weak var host: CastButtonHostView?
  }

  private static var entries: [Entry] = []

  /// Append `host` as the most recently attached button. Re-registering an
  /// already-known host moves it to the end (it just re-attached — it IS the
  /// last-attached one). Main thread only.
  static func register(_ host: CastButtonHostView) {
    dispatchPrecondition(condition: .onQueue(.main))
    entries.removeAll { $0.host == nil || $0.host === host }
    entries.append(Entry(host: host))
  }

  /// Remove `host` (window detach, recycle). Idempotent. Main thread only.
  static func unregister(_ host: CastButtonHostView) {
    dispatchPrecondition(condition: .onQueue(.main))
    entries.removeAll { $0.host == nil || $0.host === host }
  }

  /// The overlay anchor: the last-attached host that is still in a window and
  /// not hidden (E10 anchor check — attached + `!isHidden`; the hidden check
  /// is on the host because RN applies `style` visibility there), else `nil`.
  /// Main thread only.
  static var current: GCKUICastButton? {
    dispatchPrecondition(condition: .onQueue(.main))
    for entry in entries.reversed() {
      if let host = entry.host, host.window != nil, !host.isHidden {
        return host.castButton
      }
    }
    return nil
  }
}

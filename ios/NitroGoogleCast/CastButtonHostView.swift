import GoogleCast
import UIKit

/// Host `UIView` for the CastButton HybridView (iOS).
///
/// Owns exactly ONE `GCKUICastButton`, created in `init` and pinned to the
/// host's bounds in `layoutSubviews` — fixing the v4 bug where a brand-new
/// button was re-created (and stacked as another subview) on every
/// `layoutSubviews` pass.
///
/// Window attach/detach is reported via `onWindowChanged` from
/// `didMoveToWindow` (the E10 attach hook) so `CastButtonRegistry` can keep
/// its attach-ordered entries in sync.
final class CastButtonHostView: UIView {
  /// The single Cast button this host owns for its whole lifetime.
  let castButton: GCKUICastButton

  /// Fired from `didMoveToWindow`; `attached == true` when the view just
  /// entered a window, `false` when it left one.
  var onWindowChanged: ((_ attached: Bool) -> Void)?

  override init(frame: CGRect) {
    castButton = GCKUICastButton(frame: CGRect(origin: .zero, size: frame.size))
    super.init(frame: frame)
    addSubview(castButton)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("CastButtonHostView does not support NSCoder")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    castButton.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    onWindowChanged?(window != nil)
  }
}

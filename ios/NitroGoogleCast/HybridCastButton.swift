import Foundation
import GoogleCast
import NitroModules
import UIKit

/// Nitro implementation of the `CastButton` HybridView (iOS).
///
/// Holds one `CastButtonHostView` (which owns a single `GCKUICastButton`
/// created once — the v4 recreate-every-`layoutSubviews` bug is dead). The
/// host's window attach/detach drives `CastButtonRegistry` (E10) so
/// `showIntroductoryOverlay` can anchor on the last-attached visible button.
///
/// All view/prop work happens on the main thread (Nitro applies view props
/// there); no GCK state is cached here (Invariant 1 — the button itself is
/// UI, not a session handle).
final class HybridCastButton: HybridCastButtonSpec {
  private let hostView: CastButtonHostView

  override init() {
    hostView = CastButtonHostView(frame: .zero)
    super.init()
    hostView.onWindowChanged = { [weak hostView] attached in
      guard let hostView else { return }
      if attached {
        CastButtonRegistry.register(hostView)
      } else {
        CastButtonRegistry.unregister(hostView)
      }
    }
  }

  var view: UIView { hostView }

  /// Processed AARRGGBB color int (RN `processColor` output, sent as a
  /// number). `nil` restores the default (inherited) tint — the React wrapper
  /// always includes the key so removing the prop resets instead of
  /// stranding the old tint (E11).
  var tintColor: Double? {
    didSet { hostView.castButton.tintColor = tintColor.flatMap(Self.color(fromProcessed:)) }
  }

  /// A HybridView's default `memorySize` measures the native view; this
  /// wrapper adds only a fixed-size host + button, so report a small constant.
  var memorySize: Int { 128 }

  /// Convert an RN processed color (AARRGGBB packed into a 32-bit int, which
  /// may arrive as a negative signed value) to `UIColor`. Unrepresentable
  /// numbers map to `nil` (default tint) instead of trapping in a bridge hop.
  private static func color(fromProcessed value: Double) -> UIColor? {
    guard let packed = Int64(exactly: value.rounded()) else { return nil }
    let bits = UInt32(truncatingIfNeeded: packed)
    return UIColor(
      red: CGFloat((bits >> 16) & 0xFF) / 255.0,
      green: CGFloat((bits >> 8) & 0xFF) / 255.0,
      blue: CGFloat(bits & 0xFF) / 255.0,
      alpha: CGFloat((bits >> 24) & 0xFF) / 255.0
    )
  }
}

extension HybridCastButton: RecyclableView {
  /// Reset to the default-props state before this view instance is re-used
  /// for a different React node: leave the registry (E10 — a recycled button
  /// is not an overlay anchor until it re-attaches) and drop the tint.
  func prepareForRecycle() {
    CastButtonRegistry.unregister(hostView)
    tintColor = nil
  }
}

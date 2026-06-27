import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `WebImage` struct into a Google Cast `GCKImage`.
///
/// Part of the per-platform struct↔GCK converter layer (Phase 2 / T1). The reverse
/// direction lives in `GCKImage+toWebImage.swift`. GCK image dimensions are required
/// `NSInteger`s, so absent width/height default to `0`.
extension WebImage {
  func toGckImage() -> GCKImage {
    let imageUrl = URL(string: url) ?? URL(string: "about:blank")!
    return GCKImage(
      url: imageUrl,
      width: Int(width ?? 0),
      height: Int(height ?? 0)
    )
  }
}

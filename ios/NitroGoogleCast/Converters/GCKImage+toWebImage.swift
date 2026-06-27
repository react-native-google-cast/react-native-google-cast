import Foundation
import GoogleCast

/// Converts a Google Cast `GCKImage` into a generated `WebImage` struct.
///
/// Reverse of `WebImage+toGckImage.swift`. GCK always carries concrete (possibly `0`)
/// dimensions, so width/height are emitted as present numbers.
extension GCKImage {
  func toWebImage() -> WebImage {
    return WebImage(
      url: url.absoluteString,
      width: Double(width),
      height: Double(height)
    )
  }
}

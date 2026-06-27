import Foundation
import GoogleCast

/// Converts a `GCKVideoInfo` into a generated `VideoInfo` struct.
///
/// `GCKVideoInfo` is a receive-only GCK type (no public initializer); this GCK→struct
/// direction is the one used in the real app. `width`/`height` are non-optional `NSUInteger`
/// in GCK, so they are always emitted. `hdrType` `Unknown` maps to `nil`.
extension GCKVideoInfo {
  func toVideoInfo() -> VideoInfo {
    return VideoInfo(
      hdrType: hdrType.toVideoHdrType(),
      width: Double(width),
      height: Double(height)
    )
  }
}

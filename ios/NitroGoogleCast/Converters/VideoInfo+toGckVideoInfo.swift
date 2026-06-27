import Foundation
import GoogleCast

/// Debug-seam constructor: builds a `GCKVideoInfo` from a generated `VideoInfo` struct.
///
/// `GCKVideoInfo` is receive-only (read-only properties, no public initializer), so the real
/// app never sends it; this direction exists only so the cross-platform round-trip parity
/// suite can exercise the reverse converter (`GCKVideoInfo+toVideoInfo.swift`). Read-only
/// properties are populated via KVC against the backing ivars.
///
/// `width`/`height` are non-optional in GCK; absent values are written as `0` and come back as
/// `0`. An absent `hdrType` leaves GCK's default (pinned by the corpus).
extension VideoInfo {
  func toGckVideoInfo() -> GCKVideoInfo {
    let info = GCKVideoInfo()
    info.setValue(NSNumber(value: UInt(width ?? 0)), forKey: "width")
    info.setValue(NSNumber(value: UInt(height ?? 0)), forKey: "height")
    if let hdrType {
      info.setValue(NSNumber(value: hdrType.toGckHdrType().rawValue), forKey: "hdrType")
    }
    return info
  }
}

import Foundation
import GoogleCast

/// Debug-seam constructor: builds a `GCKMediaLiveSeekableRange` from a generated struct.
///
/// `GCKMediaLiveSeekableRange` is receive-only (read-only properties, no public initializer),
/// so the real app never sends it; this direction exists only so the cross-platform round-trip
/// parity suite can exercise the reverse converter
/// (`GCKMediaLiveSeekableRange+toMediaLiveSeekableRange.swift`). Properties are populated via
/// KVC against the backing ivars.
extension MediaLiveSeekableRange {
  func toGckMediaLiveSeekableRange() -> GCKMediaLiveSeekableRange {
    let range = GCKMediaLiveSeekableRange()
    range.setValue(startTime, forKey: "startTime")
    range.setValue(endTime, forKey: "endTime")
    range.setValue(isMovingWindow, forKey: "isMovingWindow")
    range.setValue(isLiveDone, forKey: "isLiveDone")
    return range
  }
}

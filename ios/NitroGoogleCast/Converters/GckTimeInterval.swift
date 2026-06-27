import Foundation
import GoogleCast

/// Normalizes a GCK `NSTimeInterval` to an optional, mapping GCK's "unset" representations to
/// `nil`. GCK uses two distinct sentinels for unset time intervals: `kGCKInvalidTimeInterval`
/// (caught by `GCKIsValidTimeInterval`) and, for some builders (e.g. `GCKMediaQueueItem`'s
/// `playbackDuration`), positive infinity ("play to end"). Both collapse to `nil` so a value
/// that was never set round-trips as absent.
func gckFiniteTimeInterval(_ value: TimeInterval) -> Double? {
  guard GCKIsValidTimeInterval(value), value.isFinite else {
    return nil
  }
  return value
}

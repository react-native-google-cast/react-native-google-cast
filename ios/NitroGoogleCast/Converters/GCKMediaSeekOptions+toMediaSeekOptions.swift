import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaSeekOptions` into a generated `MediaSeekOptions` struct.
///
/// Reverse of `MediaSeekOptions+toGckMediaSeekOptions.swift`. GCK's `interval`/`relative`/
/// `seekToInfinite` are non-optional, so `position`/`relative`/`infinite` are always emitted
/// (the corpus pins GCK's defaults for the absent case). `resumeState` `Unchanged` → `nil`.
extension GCKMediaSeekOptions {
  func toMediaSeekOptions() -> MediaSeekOptions {
    return MediaSeekOptions(
      position: interval,
      relative: relative,
      infinite: seekToInfinite,
      resumeState: resumeState.toMediaSeekResumeState(),
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

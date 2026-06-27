import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaSeekOptions` struct into a `GCKMediaSeekOptions`.
///
/// Reverse lives in `GCKMediaSeekOptions+toMediaSeekOptions.swift`. `position` maps to GCK's
/// `interval`, and `infinite` maps to `seekToInfinite`. `position`/`relative`/`infinite` are
/// non-optional in GCK; when absent we leave GCK's `init()` defaults, so the reverse always
/// emits values (the corpus pins the observed defaults). `resumeState` absent maps to GCK
/// `Unchanged` (→ `nil` on reverse).
extension MediaSeekOptions {
  func toGckMediaSeekOptions() -> GCKMediaSeekOptions {
    let options = GCKMediaSeekOptions()
    if let position { options.interval = position }
    if let relative { options.relative = relative }
    if let infinite { options.seekToInfinite = infinite }
    if let resumeState { options.resumeState = resumeState.toGckResumeState() }
    if let customData { options.customData = customData.toGckCustomData() }
    return options
  }
}

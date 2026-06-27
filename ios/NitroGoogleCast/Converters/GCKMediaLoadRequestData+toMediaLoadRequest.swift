import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaLoadRequestData` into a generated `MediaLoadRequest` struct.
///
/// Reverse of `MediaLoadRequest+toGckMediaLoadRequestData.swift`. `autoplay` round-trips as a
/// true optional (`NSNumber?`). `startTime` is guarded with `GCKIsValidTimeInterval`.
/// `playbackRate` is non-optional in GCK and always emitted (the corpus pins the builder
/// default for the absent case).
extension GCKMediaLoadRequestData {
  func toMediaLoadRequest() -> MediaLoadRequest {
    return MediaLoadRequest(
      mediaInfo: mediaInformation?.toMediaInfo(),
      queueData: queueData?.toMediaQueueData(),
      autoplay: autoplay?.boolValue,
      startTime: gckFiniteTimeInterval(startTime),
      playbackRate: Double(playbackRate),
      credentials: credentials,
      credentialsType: credentialsType,
      customData: AnyMap.fromGckCustomData(customData)
    )
  }
}

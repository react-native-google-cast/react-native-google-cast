import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaQueueData` struct into a `GCKMediaQueueData` via
/// `GCKMediaQueueDataBuilder`.
///
/// Reverse lives in `GCKMediaQueueData+toMediaQueueData.swift`. `type` absent maps to the
/// builder default `Generic` (our union has no `generic`, so it round-trips back to `nil`).
/// `repeatMode` absent maps to `Unchanged` (→ `nil`). `startIndex` is non-optional in GCK, so
/// the reverse always emits a value (the corpus pins the observed default).
extension MediaQueueData {
  func toGckMediaQueueData() -> GCKMediaQueueData {
    let builder = GCKMediaQueueDataBuilder(queueType: type?.toGckQueueType() ?? .generic)
    if let id { builder.queueID = id }
    if let name { builder.name = name }
    if let entity { builder.entity = entity }
    if let repeatMode { builder.repeatMode = repeatMode.toGckRepeatMode() }
    if let containerMetadata {
      builder.containerMetadata = containerMetadata.toGckMediaQueueContainerMetadata()
    }
    if let items { builder.items = items.map { $0.toGckMediaQueueItem() } }
    if let startIndex { builder.startIndex = UInt(startIndex) }
    if let startTime { builder.startTime = startTime }
    return builder.build()
  }
}

import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaQueueData` into a generated `MediaQueueData` struct.
///
/// Reverse of `MediaQueueData+toGckMediaQueueData.swift`. `queueType` `Generic` and
/// `repeatMode` `Unchanged` map to `nil`. `startIndex` is non-optional in GCK and always
/// emitted. `startTime` is guarded with `GCKIsValidTimeInterval`. Empty `items` normalizes to
/// `nil`.
extension GCKMediaQueueData {
  func toMediaQueueData() -> MediaQueueData {
    let mappedItems = (items ?? []).map { $0.toMediaQueueItem() }

    return MediaQueueData(
      id: queueID,
      name: name,
      entity: entity,
      type: queueType.toMediaQueueType(),
      repeatMode: repeatMode.toMediaRepeatMode(),
      containerMetadata: containerMetadata?.toMediaQueueContainerMetadata(),
      items: mappedItems.isEmpty ? nil : mappedItems,
      startIndex: Double(startIndex),
      startTime: gckFiniteTimeInterval(startTime)
    )
  }
}

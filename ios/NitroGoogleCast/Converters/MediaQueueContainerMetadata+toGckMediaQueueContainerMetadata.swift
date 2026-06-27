import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaQueueContainerMetadata` struct into a
/// `GCKMediaQueueContainerMetadata` via `GCKMediaQueueContainerMetadataBuilder`.
///
/// Reverse lives in `GCKMediaQueueContainerMetadata+toMediaQueueContainerMetadata.swift`.
/// `containerType` is non-optional in GCK; absent maps to the builder default `Generic`, which
/// the reverse maps to `generic` (so absent `containerType` normalizes to `generic`).
/// `authors`/`narrators`/`publisher`/`releaseDate` are not modelled by our struct.
extension MediaQueueContainerMetadata {
  func toGckMediaQueueContainerMetadata() -> GCKMediaQueueContainerMetadata {
    let builder = GCKMediaQueueContainerMetadataBuilder(
      containerType: containerType?.toGckContainerType() ?? .generic)
    if let title { builder.title = title }
    if let containerDuration { builder.containerDuration = containerDuration }
    if let containerImages { builder.containerImages = containerImages.map { $0.toGckImage() } }
    if let sections { builder.sections = sections.map { $0.toGckMediaMetadata() } }
    return builder.build()
  }
}

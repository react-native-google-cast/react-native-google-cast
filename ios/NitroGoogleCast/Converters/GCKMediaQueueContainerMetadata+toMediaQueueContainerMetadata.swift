import Foundation
import GoogleCast
import NitroModules

/// Converts a `GCKMediaQueueContainerMetadata` into a generated
/// `MediaQueueContainerMetadata` struct.
///
/// Reverse of `MediaQueueContainerMetadata+toGckMediaQueueContainerMetadata.swift`.
/// `containerType` is always present in GCK (`Generic` default → `generic`).
/// `containerDuration` is guarded with `GCKIsValidTimeInterval`. Empty image/section arrays
/// normalize to `nil`.
extension GCKMediaQueueContainerMetadata {
  func toMediaQueueContainerMetadata() -> MediaQueueContainerMetadata {
    let images = containerImages.map { $0.toWebImage() }
    let metas = sections.map { $0.toMediaMetadata() }

    return MediaQueueContainerMetadata(
      containerType: containerType.toMediaQueueContainerType(),
      title: title,
      containerDuration: gckFiniteTimeInterval(containerDuration),
      containerImages: images.isEmpty ? nil : images,
      sections: metas.isEmpty ? nil : metas
    )
  }
}

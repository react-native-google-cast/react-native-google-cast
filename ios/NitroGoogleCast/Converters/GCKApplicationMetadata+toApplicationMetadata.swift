import Foundation
import GoogleCast

/// Converts a `GCKApplicationMetadata` into a generated `ApplicationMetadata` struct.
///
/// `GCKApplicationMetadata` is a receive-only GCK type (all properties read-only); this
/// GCK→struct direction is the one used in the real app. `images` (deprecated in GCK) and
/// `namespaces` are nullable; absent collections become empty arrays.
extension GCKApplicationMetadata {
  func toApplicationMetadata() -> ApplicationMetadata {
    let mappedImages = (images ?? []).map { $0.toWebImage() }
    return ApplicationMetadata(
      applicationId: applicationID,
      images: mappedImages,
      name: applicationName,
      namespaces: namespaces ?? []
    )
  }
}

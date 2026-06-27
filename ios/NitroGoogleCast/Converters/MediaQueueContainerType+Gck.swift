import Foundation
import GoogleCast

/// Value-based mapping between our `MediaQueueContainerType` union and
/// `GCKMediaQueueContainerType`.
///
/// GCK values: `Generic=0, AudioBook=1`. 1:1 with our union (`generic`, `audioBook`).
/// Optional field, so an absent container type maps to `nil` (the builder defaults to
/// `Generic`, which maps back to `generic`). Mapped by value.
extension MediaQueueContainerType {
  func toGckContainerType() -> GCKMediaQueueContainerType {
    switch self {
    case .generic: return .generic
    case .audiobook: return .audioBook
    }
  }
}

extension GCKMediaQueueContainerType {
  func toMediaQueueContainerType() -> MediaQueueContainerType {
    switch self {
    case .audioBook: return .audiobook
    default: return .generic
    }
  }
}

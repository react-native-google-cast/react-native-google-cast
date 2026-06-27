import Foundation
import GoogleCast

/// Value-based mapping between our `StandbyState` union and `GCKStandbyStatus`.
///
/// GCK values: `Unknown=-1, Inactive=0, Active=1`. 1:1 with our union (`unknown`, `inactive`,
/// `active`). Mapped by value.
extension StandbyState {
  func toGckStandbyStatus() -> GCKStandbyStatus {
    switch self {
    case .unknown: return .unknown
    case .inactive: return .inactive
    case .active: return .active
    }
  }
}

extension GCKStandbyStatus {
  func toStandbyState() -> StandbyState {
    switch self {
    case .inactive: return .inactive
    case .active: return .active
    default: return .unknown
    }
  }
}

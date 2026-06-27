import Foundation
import GoogleCast

/// Value-based mapping between our `VideoHdrType` union and `GCKVideoInfoHDRType`.
///
/// GCK values: `Unknown=-1, SDR=0, DV=1, HDR=2`. Optional field, so GCK `Unknown` maps to
/// `nil`. Mapped by value.
extension VideoHdrType {
  func toGckHdrType() -> GCKVideoInfoHDRType {
    switch self {
    case .sdr: return .SDR
    case .dv: return .DV
    case .hdr: return .HDR
    }
  }
}

extension GCKVideoInfoHDRType {
  func toVideoHdrType() -> VideoHdrType? {
    switch self {
    case .SDR: return .sdr
    case .DV: return .dv
    case .HDR: return .hdr
    default: return nil  // Unknown
    }
  }
}

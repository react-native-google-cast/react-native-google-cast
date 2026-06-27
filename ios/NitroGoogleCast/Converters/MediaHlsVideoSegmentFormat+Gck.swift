import Foundation
import GoogleCast

/// Value-based mapping between our `MediaHlsVideoSegmentFormat` union and
/// `GCKHLSVideoSegmentFormat`.
///
/// GCK values: `Undefined=0, MPEG2_TS=1, FMP4=2`. Optional field, so GCK `Undefined` maps to
/// `nil`. Mapped by value.
extension MediaHlsVideoSegmentFormat {
  func toGckHlsVideoSegmentFormat() -> GCKHLSVideoSegmentFormat {
    switch self {
    case .mpeg2Ts: return .MPEG2_TS
    case .fmp4: return .FMP4
    }
  }
}

extension GCKHLSVideoSegmentFormat {
  func toMediaHlsVideoSegmentFormat() -> MediaHlsVideoSegmentFormat? {
    switch self {
    case .MPEG2_TS: return .mpeg2Ts
    case .FMP4: return .fmp4
    default: return nil  // Undefined
    }
  }
}

import Foundation
import GoogleCast

/// Value-based mapping between our `MediaHlsSegmentFormat` union and `GCKHLSSegmentFormat`.
///
/// GCK values: `Undefined=0, AAC=1, AC3=2, MP3=3, TS=4, TS_AAC=5, E_AC3=6, FMP4=7`. Optional
/// field, so GCK `Undefined` maps to `nil`. Mapped by value.
extension MediaHlsSegmentFormat {
  func toGckHlsSegmentFormat() -> GCKHLSSegmentFormat {
    switch self {
    case .aac: return .AAC
    case .ac3: return .AC3
    case .mp3: return .MP3
    case .ts: return .TS
    case .tsAac: return .TS_AAC
    case .eAc3: return .E_AC3
    case .fmp4: return .FMP4
    }
  }
}

extension GCKHLSSegmentFormat {
  func toMediaHlsSegmentFormat() -> MediaHlsSegmentFormat? {
    switch self {
    case .AAC: return .aac
    case .AC3: return .ac3
    case .MP3: return .mp3
    case .TS: return .ts
    case .TS_AAC: return .tsAac
    case .E_AC3: return .eAc3
    case .FMP4: return .fmp4
    default: return nil  // Undefined
    }
  }
}
